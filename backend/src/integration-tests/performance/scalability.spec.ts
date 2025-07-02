import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as jwt from 'jsonwebtoken';

/**
 * パフォーマンス・スケーラビリティ統合テスト
 * 
 * エンタープライズ級負荷に対する性能検証
 * - 高負荷・大量データ処理性能
 * - データベースクエリ最適化検証
 * - メモリ・CPU使用量監視
 * - 同時接続・トランザクション処理能力
 */
describe('Performance & Scalability Integration Tests', () => {
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

    // パフォーマンステスト用設定
    tenantId = 'test-tenant-performance';
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'test-secret';

    const baseTokenData = {
      tenantId,
      organizationId: 'org_HHiSxAxNqdJoipla',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7200, // 2時間
    };

    adminToken = jwt.sign({
      ...baseTokenData,
      sub: 'admin-perf-test',
      email: 'admin@performance-test.com',
      permissions: ['admin:all', 'read:all', 'write:all'],
      roles: ['admin'],
    }, jwtSecret);

    userToken = jwt.sign({
      ...baseTokenData,
      sub: 'user-perf-test',
      email: 'user@performance-test.com',
      permissions: ['read:procurement', 'write:procurement-request'],
      roles: ['employee'],
    }, jwtSecret);

    await setupPerformanceTestData();
  });

  afterAll(async () => {
    await cleanupPerformanceTestData();
    await app.close();
  });

  describe('高負荷耐性テスト', () => {
    it('同時接続処理能力テスト（100並行リクエスト）', async () => {
      const concurrentRequests = 100;
      const requests = Array(concurrentRequests).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .query({ 
            page: Math.floor(index / 10) + 1,
            limit: 10,
            sortBy: 'createdAt',
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // 成功率検証
      const successfulResponses = responses.filter(res => res.status === 200);
      const successRate = (successfulResponses.length / concurrentRequests) * 100;

      expect(successRate).toBeGreaterThanOrEqual(95); // 95%以上の成功率
      expect(totalTime).toBeLessThan(15000); // 15秒以内
      
      console.log(`✅ 同時接続テスト: ${concurrentRequests}リクエスト, 成功率: ${successRate}%, 実行時間: ${totalTime}ms`);
    });

    it('大量データ作成パフォーマンステスト', async () => {
      const batchSize = 50;
      const batches = 5;
      const totalRequests = batchSize * batches;

      const startTime = Date.now();
      const creationPromises = [];

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = Array(batchSize).fill(null).map((_, index) =>
          request(app.getHttpServer())
            .post('/api/v1/procurement/requests')
            .set('Authorization', `Bearer ${userToken}`)
            .set('x-tenant-id', tenantId)
            .send({
              title: `パフォーマンステスト依頼 ${batch}-${index}`,
              description: `大量データ作成テスト用 バッチ${batch} アイテム${index}`,
              priority: ['LOW', 'MEDIUM', 'HIGH'][index % 3],
              estimatedAmount: Math.floor(Math.random() * 500000) + 50000,
              requiredDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
              items: [{
                name: `商材${batch}-${index}`,
                quantity: Math.floor(Math.random() * 10) + 1,
                unitPrice: Math.floor(Math.random() * 50000) + 10000,
                description: `テスト商材 ${batch}-${index}`,
              }],
            })
        );

        creationPromises.push(...batchPromises);
      }

      const responses = await Promise.all(creationPromises);
      const totalTime = Date.now() - startTime;

      const successfulCreations = responses.filter(res => res.status === 201);
      const successRate = (successfulCreations.length / totalRequests) * 100;

      expect(successRate).toBeGreaterThanOrEqual(90); // 90%以上の成功率
      expect(totalTime).toBeLessThan(30000); // 30秒以内
      
      console.log(`✅ 大量作成テスト: ${totalRequests}件作成, 成功率: ${successRate}%, 実行時間: ${totalTime}ms`);
    });

    it('大量データ検索パフォーマンステスト', async () => {
      const searchTerms = [
        'パフォーマンステスト',
        'テスト商材',
        '大量データ',
        'バッチ',
        'アイテム',
      ];

      const startTime = Date.now();
      const searchPromises = searchTerms.map(term =>
        request(app.getHttpServer())
          .get('/api/v1/search')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .query({
            q: term,
            types: 'procurement_request',
            limit: 100,
          })
      );

      const responses = await Promise.all(searchPromises);
      const totalTime = Date.now() - startTime;

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.executionTime).toBeLessThan(3000); // 3秒以内
        console.log(`🔍 検索「${searchTerms[index]}」: ${response.body.totalCount}件, ${response.body.executionTime}ms`);
      });

      expect(totalTime).toBeLessThan(10000); // 10秒以内
      console.log(`✅ 大量データ検索テスト: ${searchTerms.length}検索, 総実行時間: ${totalTime}ms`);
    });
  });

  describe('データベースパフォーマンステスト', () => {
    it('複雑クエリパフォーマンステスト', async () => {
      const complexQueryStartTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/procurement-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          dateRange: 'last_30_days',
          groupBy: 'department,priority,status',
          includeMetrics: 'count,total_amount,average_amount,processing_time',
          format: 'detailed',
        })
        .expect(200);

      const executionTime = Date.now() - complexQueryStartTime;

      expect(response.body).toMatchObject({
        analytics: expect.any(Object),
        summary: expect.any(Object),
        executionTime: expect.any(Number),
        dataPoints: expect.any(Number),
      });

      expect(executionTime).toBeLessThan(5000); // 5秒以内
      expect(response.body.executionTime).toBeLessThan(3000); // DB処理3秒以内
      
      console.log(`✅ 複雑クエリテスト: ${response.body.dataPoints}データポイント, DB実行時間: ${response.body.executionTime}ms, 総時間: ${executionTime}ms`);
    });

    it('大量データページネーション効率テスト', async () => {
      const pageTests = [
        { page: 1, expectedTime: 1000 },   // 1秒以内
        { page: 10, expectedTime: 1500 },  // 1.5秒以内
        { page: 50, expectedTime: 2000 },  // 2秒以内
        { page: 100, expectedTime: 3000 }, // 3秒以内
      ];

      for (const test of pageTests) {
        const startTime = Date.now();
        
        const response = await request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .query({
            page: test.page,
            limit: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
          .expect(200);

        const executionTime = Date.now() - startTime;

        expect(executionTime).toBeLessThan(test.expectedTime);
        expect(response.body.pagination.page).toBe(test.page);
        
        console.log(`📄 ページ${test.page}: ${response.body.data.length}件, ${executionTime}ms`);
      }
    });

    it('インデックス効果検証テスト', async () => {
      // インデックスが効いているカラムでの検索
      const indexedQueryStart = Date.now();
      const indexedResponse = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          status: 'PENDING',
          createdAfter: '2024-01-01',
          limit: 100,
        });
      const indexedTime = Date.now() - indexedQueryStart;

      // テキスト検索（フルテーブルスキャンが必要）
      const fullScanStart = Date.now();
      const fullScanResponse = await request(app.getHttpServer())
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          q: 'パフォーマンステスト',
          types: 'procurement_request',
          limit: 100,
        });
      const fullScanTime = Date.now() - fullScanStart;

      expect(indexedResponse.status).toBe(200);
      expect(fullScanResponse.status).toBe(200);
      
      // インデックス検索は一般的に高速
      expect(indexedTime).toBeLessThan(2000); // 2秒以内
      expect(fullScanTime).toBeLessThan(5000); // 5秒以内

      console.log(`⚡ インデックス検索: ${indexedTime}ms, フルスキャン検索: ${fullScanTime}ms`);
    });
  });

  describe('メモリ・リソース使用量テスト', () => {
    it('大量データ処理時のメモリ使用量監視', async () => {
      const initialMemory = process.memoryUsage();
      
      // 大量データを処理する操作
      const largeDataResponse = await request(app.getHttpServer())
        .get('/api/v1/procurement/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .query({
          limit: 1000, // 大量データ取得
          includeItems: 'true',
          includeHistory: 'true',
          includeApprovals: 'true',
        })
        .expect(200);

      const afterMemory = process.memoryUsage();
      const memoryIncrease = {
        heapUsed: afterMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: afterMemory.heapTotal - initialMemory.heapTotal,
        rss: afterMemory.rss - initialMemory.rss,
      };

      expect(largeDataResponse.body.data).toBeDefined();
      
      // メモリ使用量が適切な範囲内
      expect(memoryIncrease.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB以内
      
      console.log(`📊 メモリ使用量増加: Heap ${Math.round(memoryIncrease.heapUsed / 1024 / 1024)}MB, RSS ${Math.round(memoryIncrease.rss / 1024 / 1024)}MB`);
      
      // ガベージコレクションの実行
      global.gc && global.gc();
    });

    it('長時間実行でのメモリリーク検出', async () => {
      const iterations = 20;
      const memorySnapshots = [];

      for (let i = 0; i < iterations; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .query({ page: (i % 10) + 1, limit: 20 });

        if (i % 5 === 0) {
          const memory = process.memoryUsage();
          memorySnapshots.push(memory.heapUsed);
        }

        // 小さな待機でGCの実行を促す
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // メモリ使用量の傾向分析
      const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
      const averageGrowth = memoryGrowth / memorySnapshots.length;

      // 大きなメモリリークがないことを確認
      expect(averageGrowth).toBeLessThan(5 * 1024 * 1024); // 平均5MB以内の増加

      console.log(`🔍 メモリリークテスト: ${iterations}回実行, 平均増加量: ${Math.round(averageGrowth / 1024)}KB`);
    });
  });

  describe('セキュリティ機能パフォーマンステスト', () => {
    it('レート制限機能パフォーマンステスト', async () => {
      const rateLimitRequests = 50;
      const requests = Array(rateLimitRequests).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .query({ limit: 1 })
      );

      const startTime = Date.now();
      const responses = await Promise.allSettled(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 200
      ).length;
      const rateLimitedCount = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      ).length;

      expect(successCount + rateLimitedCount).toBe(rateLimitRequests);
      expect(rateLimitedCount).toBeGreaterThan(0); // レート制限が動作
      
      console.log(`🛡️ レート制限テスト: ${successCount}成功, ${rateLimitedCount}制限, ${totalTime}ms`);
    });

    it('CSRF保護パフォーマンステスト', async () => {
      // CSRFトークン取得
      const tokenResponse = await request(app.getHttpServer())
        .post('/api/v1/csrf/token')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-tenant-id', tenantId)
        .expect(201);

      const csrfToken = tokenResponse.body.token;

      // CSRF保護が有効な操作を複数回実行
      const csrfProtectedRequests = 10;
      const requests = Array(csrfProtectedRequests).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .post('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${userToken}`)
          .set('x-tenant-id', tenantId)
          .set('x-csrf-token', csrfToken)
          .send({
            title: `CSRF保護テスト ${index}`,
            description: 'CSRF性能テスト',
            estimatedAmount: 10000,
            requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ name: `商材${index}`, quantity: 1, unitPrice: 10000 }],
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(res => res.status === 201).length;
      expect(successCount).toBe(csrfProtectedRequests);
      expect(totalTime).toBeLessThan(15000); // 15秒以内

      console.log(`🔒 CSRF保護パフォーマンス: ${successCount}件成功, ${totalTime}ms`);
    });
  });

  describe('スケーラビリティ実証テスト', () => {
    it('マルチテナント環境でのパフォーマンス分離', async () => {
      const tenants = ['tenant-1', 'tenant-2', 'tenant-3'];
      const requestsPerTenant = 20;

      // 各テナントでデータ作成
      const tenantSetupPromises = tenants.map(async (tenant) => {
        await prisma.tenant.upsert({
          where: { id: tenant },
          update: {},
          create: {
            id: tenant,
            name: `パフォーマンステスト企業 ${tenant}`,
            code: `TEST_${tenant.toUpperCase()}`,
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            settings: {},
          },
        });

        // テナント固有トークン
        const tenantToken = jwt.sign({
          sub: `user-${tenant}`,
          email: `user@${tenant}.com`,
          tenantId: tenant,
          organizationId: 'org_HHiSxAxNqdJoipla',
          permissions: ['read:procurement', 'write:procurement-request'],
          roles: ['employee'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        }, configService.get<string>('JWT_SECRET') || 'test-secret');

        return { tenant, token: tenantToken };
      });

      const tenantConfigs = await Promise.all(tenantSetupPromises);

      // 各テナントで同時にリクエスト実行
      const allRequests = tenantConfigs.flatMap(({ tenant, token }) =>
        Array(requestsPerTenant).fill(null).map((_, index) =>
          request(app.getHttpServer())
            .post('/api/v1/procurement/requests')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenant)
            .send({
              title: `${tenant} 調達依頼 ${index}`,
              description: `テナント${tenant}のパフォーマンステスト`,
              estimatedAmount: Math.floor(Math.random() * 100000) + 50000,
              requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              items: [{
                name: `${tenant}商材${index}`,
                quantity: Math.floor(Math.random() * 5) + 1,
                unitPrice: Math.floor(Math.random() * 30000) + 10000,
              }],
            })
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(allRequests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(res => res.status === 201).length;
      const expectedTotal = tenants.length * requestsPerTenant;

      expect(successCount).toBe(expectedTotal);
      expect(totalTime).toBeLessThan(30000); // 30秒以内

      // テナント分離検証
      for (const { tenant, token } of tenantConfigs) {
        const tenantDataResponse = await request(app.getHttpServer())
          .get('/api/v1/procurement/requests')
          .set('Authorization', `Bearer ${token}`)
          .set('x-tenant-id', tenant);

        expect(tenantDataResponse.body.data.every(
          (item: any) => item.tenantId === tenant
        )).toBe(true);
      }

      console.log(`🏢 マルチテナントテスト: ${tenants.length}テナント × ${requestsPerTenant}リクエスト = ${expectedTotal}件, ${totalTime}ms`);

      // クリーンアップ
      await Promise.all(tenants.map(async (tenant) => {
        await prisma.purchaseRequest.deleteMany({ where: { tenant_id: tenant } });
        await prisma.tenant.delete({ where: { id: tenant } });
      }));
    });
  });

  // パフォーマンステスト用データセットアップ
  async function setupPerformanceTestData() {
    try {
      await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
          id: tenantId,
          name: 'パフォーマンステスト企業',
          code: 'PERF_TEST',
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          settings: {},
        },
      });

      console.log('🏗️ Performance test data setup completed');
    } catch (error) {
      console.error('❌ Performance test data setup failed:', error);
    }
  }

  async function cleanupPerformanceTestData() {
    try {
      await prisma.purchaseRequest.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.vendor.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.product.deleteMany({ where: { tenant_id: tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });

      console.log('🧹 Performance test data cleanup completed');
    } catch (error) {
      console.error('❌ Performance test data cleanup failed:', error);
    }
  }
});
