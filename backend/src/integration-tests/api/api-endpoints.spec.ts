import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as jwt from 'jsonwebtoken';

/**
 * API エンドポイント統合テスト
 * 
 * 全APIエンドポイントの統合的動作検証
 * - RESTful API設計準拠確認
 * - レスポンス形式統一性検証
 * - エラーハンドリング一貫性確認
 * - パフォーマンス・スケーラビリティ検証
 */
describe('API Endpoints Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let configService: ConfigService;
  let adminToken: string;
  let userToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    configService = app.get<ConfigService>(ConfigService);
    
    await app.init();

    // テスト環境セットアップ
    tenantId = 'test-tenant-api';
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'test-secret';

    const baseTokenData = {
      tenantId,
      organizationId: 'org_HHiSxAxNqdJoipla',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    adminToken = jwt.sign({
      ...baseTokenData,
      sub: 'admin-api-test',
      email: 'admin@api-test.com',
      permissions: ['admin:all', 'read:all', 'write:all'],
      roles: ['admin'],
    }, jwtSecret);

    userToken = jwt.sign({
      ...baseTokenData,
      sub: 'user-api-test',
      email: 'user@api-test.com',
      permissions: ['read:procurement', 'write:procurement-request'],
      roles: ['employee'],
    }, jwtSecret);

    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('API バージョニング・基本構造', () => {
    it('API バージョン情報取得', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/info')
        .expect(200);

      expect(response.body).toMatchObject({
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        environment: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });

    it('APIヘルスチェック', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        info: expect.objectContaining({
          database: expect.objectContaining({ status: 'up' }),
          redis: expect.objectContaining({ status: 'up' }),
        }),
        uptime: expect.any(Number),
      });
    });

    it('存在しないエンドポイントへの適切な404レスポンス', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        statusCode: 404,
        message: expect.any(String),
      });
    });

    it('不正なHTTPメソッドへの適切な405レスポンス', async () => {
      const response = await request(app.getHttpServer())
        .patch('/health') // GETのみ許可されているエンドポイントにPATCH
        .expect(405);

      expect(response.body).toMatchObject({
        error: 'Method Not Allowed',
        statusCode: 405,
        message: expect.any(String),
      });
    });
  });

  describe('認証・認可API統合テスト', () => {
    it('認証なしリクエストの適切な401レスポンス', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        statusCode: 401,
        message: expect.any(String),
      });
    });

    it('無効なJWTトークンでの401レスポンス', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .set('Authorization', 'Bearer invalid-jwt-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        statusCode: 401,
        message: expect.stringContaining('token'),
      });
    });

    it('権限不足による403レスポンス', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`) // 管理者権限なし
        .set('x-tenant-id', tenantId)
        .expect(403);

      expect(response.body).toMatchObject({
        error: 'Forbidden',
        statusCode: 403,
        message: expect.stringContaining('permission'),
      });
    });

    it('テナントIDなしリクエストの400レスポンス', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .set('Authorization', `Bearer ${userToken}`)
        // x-tenant-idヘッダーなし
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Bad Request',
        statusCode: 400,
        message: expect.stringContaining('tenant'),
      });
    });
  });

  describe('CRUD操作API統合テスト', () => {
    describe('調達依頼API', () => {
      let procurementRequestId: string;

      it('調達依頼一覧取得（ページネーション）', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .query({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })
          .expect(200);

        expect(response.body).toMatchObject({
          data: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number),
          },
          filters: expect.any(Object),
          sorting: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        });
      });

      it('調達依頼作成（バリデーション確認）', async () => {
        const procurementRequest = {
          title: 'API統合テスト用依頼',
          description: 'APIエンドポイント統合テスト',
          priority: 'MEDIUM',
          estimatedAmount: 250000,
          requiredDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              name: 'テスト商材A',
              quantity: 5,
              unitPrice: 30000,
              description: 'APIテスト用商材',
            },
            {
              name: 'テスト商材B',
              quantity: 2,
              unitPrice: 85000,
              description: 'APIテスト用高額商材',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .send(procurementRequest)
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          title: procurementRequest.title,
          status: 'PENDING',
          totalAmount: 320000, // 5*30000 + 2*85000
          tenantId,
          createdBy: 'user-api-test',
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'テスト商材A',
              quantity: 5,
              unitPrice: 30000,
            }),
          ]),
        });

        procurementRequestId = response.body.id;
      });

      it('調達依頼詳細取得', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/procurement/requests/${procurementRequestId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .expect(200);

        expect(response.body).toMatchObject({
          id: procurementRequestId,
          title: 'API統合テスト用依頼',
          items: expect.any(Array),
          approvalStatus: expect.objectContaining({
            currentLevel: expect.any(Number),
            status: expect.any(String),
          }),
        });
      });

      it('存在しない調達依頼への404レスポンス', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/procurement/requests/non-existent-id')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .expect(404);

        expect(response.body).toMatchObject({
          error: 'Not Found',
          statusCode: 404,
          message: expect.stringContaining('not found'),
        });
      });

      it('不正なデータでの作成時400エラー', async () => {
        const invalidRequest = {
          title: '', // 必須項目が空
          priority: 'INVALID_PRIORITY', // 無効な値
          estimatedAmount: -1000, // 負の値
          requiredDate: 'invalid-date', // 無効な日付
          items: [], // 空の配列
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .send(invalidRequest)
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'Bad Request',
          statusCode: 400,
          message: expect.any(Array), // バリデーションエラー配列
        });

        expect(response.body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining('title'),
            expect.stringContaining('priority'),
            expect.stringContaining('amount'),
            expect.stringContaining('date'),
            expect.stringContaining('items'),
          ])
        );
      });
    });

    describe('ベンダー管理API', () => {
      let vendorId: string;

      it('ベンダー一覧取得（フィルタリング・ソート）', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/vendors')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('x-tenant-id', tenantId)
          .query({ 
            isActive: true, 
            category: 'OFFICE_SUPPLIES',
            search: 'テスト',
            sortBy: 'name',
            sortOrder: 'asc'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          data: expect.any(Array),
          pagination: expect.any(Object),
          filters: {
            isActive: 'true',
            category: 'OFFICE_SUPPLIES',
            search: 'テスト',
          },
        });
      });

      it('ベンダー登録（管理者権限）', async () => {
        const vendor = {
          name: 'API統合テストサプライヤー',
          code: 'SUPPLIER_API_001',
          email: 'contact@apisupplier.com',
          phone: '03-5555-0001',
          address: '東京都千代田区API1-1-1',
          contactPerson: 'APIテスト担当者',
          paymentTerms: 'NET30',
          category: 'OFFICE_SUPPLIES',
          isActive: true,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/vendors')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('x-tenant-id', tenantId)
          .send(vendor)
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          name: vendor.name,
          code: vendor.code,
          status: 'ACTIVE',
          tenantId,
          createdAt: expect.any(String),
        });

        vendorId = response.body.id;
      });

      it('一般ユーザーによるベンダー登録の権限エラー', async () => {
        const vendor = {
          name: '権限テストサプライヤー',
          code: 'UNAUTHORIZED_SUPPLIER',
          email: 'unauthorized@supplier.com',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/vendors')
          .set('Authorization', `Bearer ${userToken}`) // 管理者権限なし
          .set('x-tenant-id', tenantId)
          .send(vendor)
          .expect(403);

        expect(response.body).toMatchObject({
          error: 'Forbidden',
          statusCode: 403,
        });
      });

      it('ベンダー情報更新', async () => {
        const updates = {
          email: 'updated@apisupplier.com',
          phone: '03-5555-9999',
          isActive: false,
        };

        const response = await request(app.getHttpServer())
          .put(`/api/v1/vendors/${vendorId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .set('x-tenant-id', tenantId)
          .send(updates)
          .expect(200);

        expect(response.body).toMatchObject({
          id: vendorId,
          email: updates.email,
          phone: updates.phone,
          isActive: updates.isActive,
          updatedAt: expect.any(String),
        });
      });
    });
  });

  describe('検索・フィルタリングAPI統合テスト', () => {
    it('全文検索API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .query({ 
          q: 'API統合テスト',
          types: 'procurement_request,vendor',
          limit: 20,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        query: 'API統合テスト',
        results: expect.any(Array),
        totalCount: expect.any(Number),
        searchTypes: ['procurement_request', 'vendor'],
        executionTime: expect.any(Number),
      });
    });

    it('高度な検索フィルター', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          status: 'PENDING,APPROVED',
          priority: 'HIGH,MEDIUM',
          minAmount: 100000,
          maxAmount: 1000000,
          createdAfter: '2024-01-01',
          createdBefore: '2024-12-31',
          department: 'IT部門',
        })
        .expect(200);

      expect(response.body.filters).toMatchObject({
        status: 'PENDING,APPROVED',
        priority: 'HIGH,MEDIUM',
        minAmount: '100000',
        maxAmount: '1000000',
      });
    });

    it('ソート機能テスト', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          sortBy: 'totalAmount',
          sortOrder: 'desc',
          limit: 5,
        })
        .expect(200);

      const amounts = response.body.data.map((item: any) => item.totalAmount);
      const sortedAmounts = [...amounts].sort((a, b) => b - a);
      expect(amounts).toEqual(sortedAmounts);
    });
  });

  describe('バッチ処理・一括操作API', () => {
    it('一括承認API', async () => {
      // テスト用の複数調達依頼作成
      const requests = [];
      for (let i = 0; i < 3; i++) {
        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .send({
            title: `一括テスト依頼 ${i + 1}`,
            description: '一括承認テスト用',
            estimatedAmount: 50000,
            requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ name: `テスト商材${i + 1}`, quantity: 1, unitPrice: 50000 }],
          });
        
        requests.push(createResponse.body.id);
      }

      // 一括承認実行
      const batchApprovalResponse = await request(app.getHttpServer())
        .post('/api/v1/procurement/requests/batch-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          requestIds: requests,
          decision: 'APPROVED',
          comments: '一括承認テスト',
        })
        .expect(200);

      expect(batchApprovalResponse.body).toMatchObject({
        successful: expect.any(Array),
        failed: expect.any(Array),
        totalRequests: 3,
        successCount: expect.any(Number),
        failureCount: expect.any(Number),
      });
    });

    it('データエクスポートAPI', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/exports/procurement-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          format: 'CSV',
          dateRange: {
            from: '2024-01-01',
            to: '2024-12-31',
          },
          fields: ['title', 'status', 'totalAmount', 'createdAt'],
        })
        .expect(202); // Accepted - 非同期処理

      expect(response.body).toMatchObject({
        exportId: expect.any(String),
        status: 'PROCESSING',
        estimatedCompletion: expect.any(String),
      });
    });
  });

  describe('レスポンス形式・パフォーマンステスト', () => {
    it('統一されたエラーレスポンス形式', async () => {
      const responses = await Promise.all([
        // 400エラー
        request(app.getHttpServer())
          .post('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .send({ invalid: 'data' }),
        
        // 401エラー
        request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', 'Bearer invalid-token'),
        
        // 403エラー
        request(app.getHttpServer())
          .delete('/api/v1/admin/system-settings')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId),
        
        // 404エラー
        request(app.getHttpServer())
          .get('/api/v1/procurement/requests/non-existent')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId),
      ]);

      responses.forEach(response => {
        expect(response.body).toMatchObject({
          error: expect.any(String),
          statusCode: expect.any(Number),
          message: expect.any(String),
          timestamp: expect.any(String),
        });
      });
    });

    it('大量データ取得のパフォーマンステスト', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .query({ limit: 100 })
        .expect(200);

      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(5000); // 5秒以内
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('同時リクエスト処理能力テスト', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .query({ limit: 10 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // 全リクエストが成功
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // 適切な並行処理時間
      expect(totalTime).toBeLessThan(10000); // 10秒以内
      console.log(`✅ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
    });
  });

  // テストデータ初期化・クリーンアップ関数
  async function setupTestData() {
    try {
      await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
          id: tenantId,
          name: 'API統合テスト企業',
          code: 'API_TEST',
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          settings: {},
        },
      });

      console.log('🔧 API test data setup completed');
    } catch (error) {
      console.error('❌ API test data setup failed:', error);
    }
  }

  async function cleanupTestData() {
    try {
      await prisma.purchaseRequest.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.vendor.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });

      console.log('🧹 API test data cleanup completed');
    } catch (error) {
      console.error('❌ API test data cleanup failed:', error);
    }
  }
});
