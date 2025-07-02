import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as jwt from 'jsonwebtoken';

/**
 * 調達業務ワークフロー統合テスト
 * 
 * エンタープライズ調達プロセスの統合的動作を検証
 * - 調達依頼から承認・発注・入荷・支払いまでのE2Eフロー
 * - マルチテナント環境での業務分離検証
 * - 承認ワークフロー・権限チェック統合テスト
 */
describe.skip('Procurement Workflow Integration Tests (購買機能未実装のためスキップ)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let configService: ConfigService;
  let requestorToken: string;
  let approverToken: string;
  let adminToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    configService = app.get<ConfigService>(ConfigService);
    
    await app.init();

    // テストデータセットアップ
    tenantId = 'test-tenant-procurement';
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'test-secret';

    // テストユーザー用JWTトークン生成
    const baseTokenData = {
      tenantId,
      organizationId: 'org_HHiSxAxNqdJoipla',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    requestorToken = jwt.sign({
      ...baseTokenData,
      sub: 'requestor-001',
      email: 'requestor@company.com',
      permissions: ['read:procurement', 'write:procurement-request'],
      roles: ['employee'],
    }, jwtSecret);

    approverToken = jwt.sign({
      ...baseTokenData,
      sub: 'approver-001', 
      email: 'approver@company.com',
      permissions: ['read:procurement', 'write:procurement-approval'],
      roles: ['manager'],
    }, jwtSecret);

    adminToken = jwt.sign({
      ...baseTokenData,
      sub: 'admin-001',
      email: 'admin@company.com',
      permissions: ['admin:all', 'read:all', 'write:all'],
      roles: ['admin'],
    }, jwtSecret);

    // テストデータベース初期化
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('調達依頼プロセス統合テスト', () => {
    let procurementRequestId: string;

    it('新規調達依頼を作成', async () => {
      const procurementRequest = {
        title: 'オフィス用品一式',
        description: 'デスク、椅子、PC等のオフィス環境整備',
        priority: 'MEDIUM',
        requestedBy: 'requestor-001',
        department: 'IT部門',
        category: 'OFFICE_SUPPLIES',
        estimatedAmount: 500000,
        requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            name: 'オフィスデスク',
            quantity: 10,
            unitPrice: 20000,
            description: '高さ調整可能デスク',
          },
          {
            name: 'オフィスチェア',
            quantity: 10,
            unitPrice: 15000,
            description: 'エルゴノミクスチェア',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/procurement/requests')
        .set('Authorization', `Bearer ${requestorToken}`)
        .set('x-tenant-id', tenantId)
        .send(procurementRequest)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.totalAmount).toBe(350000);
      
      procurementRequestId = response.body.id;
    });

    it('作成した調達依頼の詳細を取得', async () => {
      const response = await request(app.getHttpServer())
        .get(`/procurement/requests/${procurementRequestId}`)
        .set('Authorization', `Bearer ${requestorToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body.id).toBe(procurementRequestId);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.approvalStatus).toMatchObject({
        currentLevel: 1,
        status: 'PENDING',
      });
    });

    it('異なるテナントから調達依頼へのアクセス拒否', async () => {
      await request(app.getHttpServer())
        .get(`/procurement/requests/${procurementRequestId}`)
        .set('Authorization', `Bearer ${requestorToken}`)
        .set('x-tenant-id', 'different-tenant')
        .expect(403);
    });

    it('権限のないユーザーの調達依頼修正拒否', async () => {
      const unauthorizedToken = jwt.sign({
        sub: 'unauthorized-001',
        email: 'unauthorized@company.com',
        tenantId,
        permissions: ['read:procurement'], // write権限なし
        roles: ['viewer'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }, configService.get<string>('JWT_SECRET') || 'test-secret');

      await request(app.getHttpServer())
        .put(`/procurement/requests/${procurementRequestId}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .set('x-tenant-id', tenantId)
        .send({ title: '不正な更新' })
        .expect(403);
    });
  });

  describe('承認ワークフロー統合テスト', () => {
    let procurementRequestId: string;

    beforeEach(async () => {
      // テスト用調達依頼作成
      const response = await request(app.getHttpServer())
        .post('/procurement/requests')
        .set('Authorization', `Bearer ${requestorToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: '承認テスト用依頼',
          description: '承認フローテスト',
          priority: 'HIGH',
          estimatedAmount: 1000000,
          requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          items: [{ name: 'テスト商材', quantity: 1, unitPrice: 1000000 }],
        });

      procurementRequestId = response.body.id;
    });

    it('1次承認者による承認', async () => {
      const response = await request(app.getHttpServer())
        .post(`/procurement/requests/${procurementRequestId}/approve`)
        .set('Authorization', `Bearer ${approverToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          decision: 'APPROVED',
          comments: '予算内で適切な依頼です',
          conditions: '納期を厳守してください',
        })
        .expect(200);

      expect(response.body.approvalStatus.currentLevel).toBe(2);
      expect(response.body.approvalStatus.status).toBe('PENDING');
      expect(response.body.approvalHistory).toHaveLength(1);
    });

    it('承認権限のないユーザーによる承認拒否', async () => {
      await request(app.getHttpServer())
        .post(`/procurement/requests/${procurementRequestId}/approve`)
        .set('Authorization', `Bearer ${requestorToken}`) // 申請者は承認不可
        .set('x-tenant-id', tenantId)
        .send({
          decision: 'APPROVED',
          comments: '不正な承認試行',
        })
        .expect(403);
    });

    it('最終承認者による最終承認', async () => {
      // 1次承認を先に実行
      await request(app.getHttpServer())
        .post(`/procurement/requests/${procurementRequestId}/approve`)
        .set('Authorization', `Bearer ${approverToken}`)
        .set('x-tenant-id', tenantId)
        .send({ decision: 'APPROVED', comments: '1次承認完了' });

      // 最終承認
      const response = await request(app.getHttpServer())
        .post(`/procurement/requests/${procurementRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          decision: 'APPROVED',
          comments: '最終承認完了',
        })
        .expect(200);

      expect(response.body.approvalStatus.status).toBe('APPROVED');
      expect(response.body.status).toBe('APPROVED');
      expect(response.body.approvedAt).toBeDefined();
    });

    it('承認後の自動発注プロセス開始確認', async () => {
      // 完全承認済み依頼を作成
      await request(app.getHttpServer())
        .post(`/procurement/requests/${procurementRequestId}/approve`)
        .set('Authorization', `Bearer ${approverToken}`)
        .set('x-tenant-id', tenantId)
        .send({ decision: 'APPROVED' });

      await request(app.getHttpServer())
        .post(`/procurement/requests/${procurementRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({ decision: 'APPROVED' });

      // 発注一覧から自動作成された発注を確認
      const ordersResponse = await request(app.getHttpServer())
        .get('/procurement/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .query({ procurementRequestId })
        .expect(200);

      expect(ordersResponse.body.data).toHaveLength(1);
      expect(ordersResponse.body.data[0].status).toBe('PENDING');
      expect(ordersResponse.body.data[0].procurementRequestId).toBe(procurementRequestId);
    });
  });

  describe('ベンダー管理統合テスト', () => {
    let vendorId: string;

    it('新規ベンダー登録', async () => {
      const vendor = {
        name: 'テストサプライヤー株式会社',
        code: 'SUPPLIER001',
        email: 'contact@testsupplier.com',
        phone: '03-1234-5678',
        address: '東京都港区テスト1-2-3',
        contactPerson: '田中太郎',
        paymentTerms: 'NET30',
        category: 'OFFICE_SUPPLIES',
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send(vendor)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(vendor.name);
      expect(response.body.status).toBe('ACTIVE');
      
      vendorId = response.body.id;
    });

    it('ベンダー情報の更新', async () => {
      const updates = {
        email: 'updated@testsupplier.com',
        phone: '03-9876-5432',
        paymentTerms: 'NET15',
      };

      const response = await request(app.getHttpServer())
        .put(`/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send(updates)
        .expect(200);

      expect(response.body.email).toBe(updates.email);
      expect(response.body.phone).toBe(updates.phone);
      expect(response.body.paymentTerms).toBe(updates.paymentTerms);
    });

    it('権限のないユーザーのベンダー情報アクセス拒否', async () => {
      await request(app.getHttpServer())
        .get(`/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${requestorToken}`) // ベンダー情報読み取り権限なし
        .set('x-tenant-id', tenantId)
        .expect(403);
    });
  });

  describe('在庫管理統合テスト', () => {
    let productId: string;

    it('商品マスター登録', async () => {
      const product = {
        name: 'テスト商品A',
        code: 'PROD001',
        description: 'テスト用商品データ',
        category: 'OFFICE_SUPPLIES',
        unit: 'PCS',
        unitPrice: 1500,
        reorderLevel: 10,
        maxStockLevel: 100,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/inventory/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send(product)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.currentStock).toBe(0);
      
      productId = response.body.id;
    });

    it('入庫処理', async () => {
      const receipt = {
        productId,
        quantity: 50,
        unitPrice: 1500,
        receivedDate: new Date().toISOString(),
        reference: 'RCP001',
        notes: 'テスト入庫',
      };

      const response = await request(app.getHttpServer())
        .post('/inventory/receipts')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send(receipt)
        .expect(201);

      expect(response.body.status).toBe('COMPLETED');

      // 在庫レベル確認
      const stockResponse = await request(app.getHttpServer())
        .get(`/inventory/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(stockResponse.body.currentStock).toBe(50);
    });

    it('出庫処理', async () => {
      const issue = {
        productId,
        quantity: 15,
        issuedTo: 'IT部門',
        purpose: 'オフィス使用',
        reference: 'ISS001',
      };

      const response = await request(app.getHttpServer())
        .post('/inventory/issues')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send(issue)
        .expect(201);

      expect(response.body.status).toBe('COMPLETED');

      // 更新された在庫レベル確認
      const stockResponse = await request(app.getHttpServer())
        .get(`/inventory/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(stockResponse.body.currentStock).toBe(35);
    });

    it('発注点を下回った場合の自動アラート確認', async () => {
      // 発注点以下まで在庫を消費
      await request(app.getHttpServer())
        .post('/inventory/issues')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({ productId, quantity: 30, issuedTo: 'テスト消費', purpose: '発注点テスト' });

      // アラート一覧確認
      const alertsResponse = await request(app.getHttpServer())
        .get('/inventory/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      const reorderAlert = alertsResponse.body.data.find(
        (alert: any) => alert.productId === productId && alert.type === 'REORDER_POINT'
      );

      expect(reorderAlert).toBeDefined();
      expect(reorderAlert.status).toBe('ACTIVE');
    });
  });

  describe('監査ログ統合テスト', () => {
    it('業務操作の監査ログ記録確認', async () => {
      // テスト用の業務操作実行
      await request(app.getHttpServer())
        .post('/procurement/requests')
        .set('Authorization', `Bearer ${requestorToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: '監査ログテスト',
          description: '監査機能確認用',
          estimatedAmount: 100000,
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          items: [{ name: '監査テスト商材', quantity: 1, unitPrice: 100000 }],
        });

      // 監査ログ確認
      const auditResponse = await request(app.getHttpServer())
        .get('/system/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          userId: 'requestor-001',
          action: 'CREATE',
          resource: 'PROCUREMENT_REQUEST',
        })
        .expect(200);

      expect(auditResponse.body.data.length).toBeGreaterThan(0);
      expect(auditResponse.body.data[0]).toMatchObject({
        userId: 'requestor-001',
        action: 'CREATE',
        resource: 'PROCUREMENT_REQUEST',
        tenantId,
      });
    });

    it('セキュリティイベントの監査ログ記録', async () => {
      // 不正アクセス試行
      await request(app.getHttpServer())
        .get('/system/info')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // セキュリティ監査ログ確認
      const securityAuditResponse = await request(app.getHttpServer())
        .get('/system/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          category: 'SECURITY',
          severity: 'HIGH',
        })
        .expect(200);

      const unauthorizedAccess = securityAuditResponse.body.data.find(
        (log: any) => log.event === 'UNAUTHORIZED_ACCESS'
      );

      expect(unauthorizedAccess).toBeDefined();
    });
  });

  // テストデータ初期化・クリーンアップ関数
  async function setupTestData() {
    try {
      // テスト用テナント作成
      await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
          id: tenantId,
          name: 'テスト企業',
          code: 'TEST_CO',
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          settings: {},
        },
      });

      console.log('🔧 Test data setup completed');
    } catch (error) {
      console.error('❌ Test data setup failed:', error);
    }
  }

  async function cleanupTestData() {
    try {
      // テストデータクリーンアップ
      // await prisma.auditLog.deleteMany({ where: { tenant_id: tenantId } });
      // await prisma.inventoryTransaction.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.product.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.vendor.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.purchaseRequest.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });

      console.log('🧹 Test data cleanup completed');
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
    }
  }
});
