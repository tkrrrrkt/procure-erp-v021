import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config'; // ConfigModule追加
import { APP_GUARD } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Auth0AuthGuard } from '../../infrastructure/external-services/auth0/auth0-auth.guard';
import { SystemController } from '../../presentation/rest/shared/system.controller'; // SystemController追加

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
    // PrismaServiceモック作成
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn().mockResolvedValue({
          id: 'auth0|user-api-test',
          email: 'user@api-test.com',
          auth0Id: 'auth0|user-api-test',
          tenantId: 'test-tenant-api',
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      organization: {
        findFirst: jest.fn(),
        upsert: jest.fn().mockResolvedValue({
          id: 'test-tenant-api',
          name: 'Test Organization',
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    // Auth0AuthGuardをモックしてJWT検証をスキップ
    class MockAuth0Guard {
      async canActivate(context: any): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new UnauthorizedException('No authorization token provided');
        }
        
        const token = authHeader.substring(7);
        if (token === 'invalid-jwt-token') {
          throw new UnauthorizedException('Invalid token');
        }
        
        // テストトークンをデコードしてユーザー情報をセット
        try {
          const decoded = jwt.decode(token) as any;
          if (decoded) {
            // SystemControllerのIAuth0User形式に合わせてユーザー情報を設定
            request.user = {
              id: decoded.sub,
              sub: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              tenantId: decoded['https://api.procure-erp.com/tenant_id'],
              auth0Id: decoded.sub,
              roles: decoded['https://app.procure-erp.com/roles'] || [],
              permissions: decoded['https://app.procure-erp.com/permissions'] || [],
              organization: decoded.org_id,
              org_id: decoded['https://api.procure-erp.com/org_id'],
              tenant_id: decoded['https://api.procure-erp.com/tenant_id'],
            };
            return true;
          }
        } catch (error) {
          throw new UnauthorizedException('Invalid token format');
        }
        
        throw new UnauthorizedException('Authentication failed');
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.local', '.env'],
          cache: true,
        }),
      ],
      controllers: [SystemController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: APP_GUARD,
          useClass: MockAuth0Guard, // グローバルガードを直接指定
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'AUTH0_DOMAIN': 'test.auth0.com',
                'AUTH0_AUDIENCE': 'test-audience',
                'AUTH0_CLIENT_ID': 'test-client-id',
                'JWT_SECRET': 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    configService = app.get<ConfigService>(ConfigService);
    
    await app.init();

    // テスト環境セットアップ
    tenantId = 'test-tenant-api';
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'test-secret';

    const namespace = 'https://api.procure-erp.com/';
    const orgId = 'org_HHiSxAxNqdJoipla';
    
    const now = Math.floor(Date.now() / 1000);
    const baseTokenData = {
      iat: now,
      exp: now + 7200, // 2時間後
      aud: 'http://localhost:3001/api/v1', // .envのAUTH0_AUDIENCEと一致
      iss: 'https://dev-22lwwfj3g02rol8a.jp.auth0.com/', // .envのAUTH0_DOMAINと一致
      scope: 'openid profile email read:profile write:profile',
      org_id: orgId,
      [`${namespace}org_id`]: orgId,
      [`${namespace}org_name`]: 'Test Organization',
      [`${namespace}tenant_id`]: tenantId,
    };

    adminToken = jwt.sign({
      ...baseTokenData,
      sub: 'auth0|admin-api-test',
      email: 'admin@api-test.com',
      name: 'Admin User',
      picture: 'https://example.com/admin.jpg',
      'https://app.procure-erp.com/roles': ['admin'],
      'https://app.procure-erp.com/permissions': ['admin:all', 'read:all', 'write:all'],
    }, jwtSecret);

    userToken = jwt.sign({
      ...baseTokenData,
      sub: 'auth0|user-api-test',
      email: 'user@api-test.com',
      name: 'Test User',
      picture: 'https://example.com/user.jpg',
      'https://app.procure-erp.com/roles': ['employee'],
      'https://app.procure-erp.com/permissions': ['read:procurement', 'write:procurement-request'],
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
        .get('/system/user/profile') // 認証が必要なエンドポイント
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
      });
    });

    it('無効なJWTトークンでの401レスポンス', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/user/profile') // 認証が必要なエンドポイント
        .set('Authorization', 'Bearer invalid-jwt-token')
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining('token'),
      });
    });

    it('認証済みユーザープロファイル取得成功', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/user/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('auth0Id');
      expect(response.body).toHaveProperty('tenantId');
      expect(response.body.auth0Id).toBe('auth0|user-api-test');
      expect(response.body.email).toBe('user@api-test.com');
    });

    it('テナントIDなしリクエストでも認証成功（テナント検証は別レイヤー）', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/user/profile')
        .set('Authorization', `Bearer ${userToken}`)
        // x-tenant-idヘッダーなし
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('auth0Id');
      expect(response.body.auth0Id).toBe('auth0|user-api-test');
      expect(response.body.email).toBe('user@api-test.com');
      expect(response.body).toHaveProperty('authProvider', 'Auth0');
    });
  });

  describe.skip('CRUD操作API統合テスト（購買機能未実装のためスキップ）', () => {
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

  describe.skip('検索・フィルタリングAPI統合テスト（購買機能未実装のためスキップ）', () => {
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

  describe.skip('バッチ処理・一括操作API（購買機能未実装のためスキップ）', () => {
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
