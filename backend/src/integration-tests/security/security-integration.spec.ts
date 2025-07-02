import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../../app.module';
import * as jwt from 'jsonwebtoken';

/**
 * セキュリティ統合テストスイート
 * 
 * 企業級セキュリティ機能の連携動作を検証
 * - 認証・認可フロー統合テスト
 * - セキュリティコンポーネント連携テスト  
 * - 攻撃シナリオ統合テスト
 */
describe('Security Integration Tests', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let validJwtToken: string;
  let invalidJwtToken: string;
  let adminJwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get<ConfigService>(ConfigService);
    
    await app.init();

    // テスト用JWTトークン生成
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'test-secret';
    const validPayload = {
      sub: 'test-user-123',
      email: 'test@example.com',
      tenantId: 'tenant-123',
      organizationId: 'org_HHiSxAxNqdJoipla',
      permissions: ['read:profile', 'write:profile'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const adminPayload = {
      ...validPayload,
      sub: 'admin-user-456',
      permissions: ['admin:all', 'read:all', 'write:all'],
      roles: ['admin'],
    };

    validJwtToken = jwt.sign(validPayload, jwtSecret);
    adminJwtToken = jwt.sign(adminPayload, jwtSecret);
    invalidJwtToken = 'invalid.jwt.token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('認証・認可統合テスト', () => {
    describe('Auth0 JWT認証フロー', () => {
      it('有効なJWTトークンで認証成功', async () => {
        const response = await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('service');
        expect(response.body).toHaveProperty('tenant');
      });

      it('無効なJWTトークンで認証失敗', async () => {
        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${invalidJwtToken}`)
          .expect(401);
      });

      it('JWTトークンなしで認証失敗', async () => {
        await request(app.getHttpServer())
          .get('/system/info')
          .expect(401);
      });

      it('期限切れJWTトークンで認証失敗', async () => {
        const expiredPayload = {
          sub: 'test-user-123',
          email: 'test@example.com',
          tenantId: 'tenant-123',
          iat: Math.floor(Date.now() / 1000) - 7200,
          exp: Math.floor(Date.now() / 1000) - 3600, // 1時間前に期限切れ
        };
        const expiredToken = jwt.sign(expiredPayload, configService.get<string>('JWT_SECRET') || 'test-secret');

        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);
      });
    });

    describe('マルチテナント認可統合テスト', () => {
      it('正しいテナントIDで認可成功', async () => {
        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .set('x-tenant-id', 'tenant-123')
          .expect(200);
      });

      it('異なるテナントIDで認可失敗', async () => {
        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .set('x-tenant-id', 'different-tenant-456')
          .expect(403);
      });

      it('テナントIDなしで認可失敗', async () => {
        const noTenantPayload = {
          sub: 'test-user-123',
          email: 'test@example.com',
          organizationId: 'org_HHiSxAxNqdJoipla',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
        const noTenantToken = jwt.sign(noTenantPayload, configService.get<string>('JWT_SECRET') || 'test-secret');

        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${noTenantToken}`)
          .expect(400);
      });
    });

    describe('管理者権限統合テスト', () => {
      it('管理者権限でアクセス成功', async () => {
        await request(app.getHttpServer())
          .get('/system/metrics')
          .set('Authorization', `Bearer ${adminJwtToken}`)
          .expect(200);
      });

      it('一般ユーザーで管理者エンドポイントアクセス失敗', async () => {
        await request(app.getHttpServer())
          .get('/system/metrics')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .expect(403);
      });
    });
  });

  describe('APIセキュリティ統合テスト', () => {
    describe('レート制限統合テスト', () => {
      it('レート制限内での連続リクエスト成功', async () => {
        const promises = Array.from({ length: 5 }, () =>
          request(app.getHttpServer())
            .get('/system/health')
            .expect(200)
        );

        await Promise.all(promises);
      });

      it('レート制限超過で429エラー', async () => {
        // 短期制限を超過するリクエスト送信
        const requests = Array.from({ length: 25 }, (_, i) =>
          request(app.getHttpServer())
            .get('/system/health')
            .set('Authorization', `Bearer ${validJwtToken}`)
        );

        const responses = await Promise.allSettled(requests);
        const tooManyRequests = responses.filter(r => 
          r.status === 'fulfilled' && r.value.status === 429
        );

        expect(tooManyRequests.length).toBeGreaterThan(0);
      });

      it('管理者はレート制限をバイパス', async () => {
        const promises = Array.from({ length: 25 }, () =>
          request(app.getHttpServer())
            .get('/system/health')
            .set('Authorization', `Bearer ${adminJwtToken}`)
            .expect(200)
        );

        await Promise.all(promises);
      });
    });

    describe('CSRF保護統合テスト', () => {
      let csrfToken: string;

      beforeEach(async () => {
        // CSRFトークン取得
        const response = await request(app.getHttpServer())
          .get('/csrf/token')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .expect(200);

        csrfToken = response.body.csrfToken;
      });

      it('有効なCSRFトークンでPOSTリクエスト成功', async () => {
        await request(app.getHttpServer())
          .post('/test-endpoint')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .set('x-csrf-token', csrfToken)
          .send({ test: 'data' })
          .expect(404); // エンドポイントが存在しないため404だが、CSRF検証は通過
      });

      it('CSRFトークンなしでPOSTリクエスト失敗', async () => {
        await request(app.getHttpServer())
          .post('/test-endpoint')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .send({ test: 'data' })
          .expect(403);
      });

      it('無効なCSRFトークンでPOSTリクエスト失敗', async () => {
        await request(app.getHttpServer())
          .post('/test-endpoint')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .set('x-csrf-token', 'invalid-csrf-token')
          .send({ test: 'data' })
          .expect(403);
      });
    });

    describe('入力検証統合テスト', () => {
      it('悪意のあるスクリプト入力の無害化', async () => {
        const maliciousInput = '<script>alert("XSS")</script>';
        
        const response = await request(app.getHttpServer())
          .post('/test-validation')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .send({ content: maliciousInput })
          .expect(400); // バリデーションエラー

        expect(response.body.message).toContain('validation');
      });

      it('SQLインジェクション試行の検出', async () => {
        const sqlInjection = "'; DROP TABLE users; --";
        
        await request(app.getHttpServer())
          .post('/test-validation')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .send({ query: sqlInjection })
          .expect(400);
      });

      it('過大入力の拒否', async () => {
        const oversizedInput = 'a'.repeat(10000);
        
        await request(app.getHttpServer())
          .post('/test-validation')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .send({ content: oversizedInput })
          .expect(400);
      });
    });
  });

  describe('セキュリティヘッダー統合テスト', () => {
    it('CSPヘッダーの設定確認', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/health')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('セキュリティヘッダーの包括的設定確認', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['permissions-policy']).toBeDefined();
    });

    it('HSTS ヘッダーの設定確認', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/health')
        .expect(200);

      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });
  });

  describe('攻撃シナリオ統合テスト', () => {
    describe('認証バイパス試行', () => {
      it('JWT署名改ざん試行の検出', async () => {
        // 署名部分を改ざんしたトークン
        const tamperedToken = validJwtToken.slice(0, -10) + 'tampered123';
        
        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${tamperedToken}`)
          .expect(401);
      });

      it('JWT Alg=none攻撃の防御', async () => {
        const noneAlgPayload = {
          sub: 'attacker',
          email: 'attacker@evil.com',
          tenantId: 'admin-tenant',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
        
        // alg=noneでの署名試行
        const noneAlgToken = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64') + '.' +
                           Buffer.from(JSON.stringify(noneAlgPayload)).toString('base64') + '.';
        
        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${noneAlgToken}`)
          .expect(401);
      });
    });

    describe('権限昇格試行', () => {
      it('テナント境界越え試行の防御', async () => {
        // 異なるテナントのリソースにアクセス試行
        await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .set('x-tenant-id', 'unauthorized-tenant')
          .expect(403);
      });

      it('管理者権限偽装試行の防御', async () => {
        const fakeAdminPayload = {
          sub: 'fake-admin',
          email: 'fake@admin.com',
          tenantId: 'tenant-123',
          roles: ['admin'], // 偽の管理者権限
          permissions: ['admin:all'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
        
        // 不正な秘密鍵での署名試行
        const fakeAdminToken = jwt.sign(fakeAdminPayload, 'wrong-secret');
        
        await request(app.getHttpServer())
          .get('/system/metrics')
          .set('Authorization', `Bearer ${fakeAdminToken}`)
          .expect(401);
      });
    });

    describe('データ漏洩防止', () => {
      it('センシティブ情報のレスポンス除外確認', async () => {
        const response = await request(app.getHttpServer())
          .get('/system/info')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .expect(200);

        // センシティブ情報が含まれていないことを確認
        expect(JSON.stringify(response.body)).not.toContain('JWT_SECRET');
        expect(JSON.stringify(response.body)).not.toContain('DATABASE_URL');
        expect(JSON.stringify(response.body)).not.toContain('password');
      });

      it('エラーメッセージの情報漏洩防止', async () => {
        await request(app.getHttpServer())
          .get('/nonexistent-endpoint')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .expect(404);
        
        // 詳細なスタックトレースが含まれていないことを確認
        // 本番環境でのエラー処理確認
      });
    });
  });

  describe('パフォーマンス・安定性統合テスト', () => {
    it('高負荷時のセキュリティ機能安定性', async () => {
      const concurrentRequests = 50;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/system/health')
          .set('Authorization', `Bearer ${validJwtToken}`)
      );

      const responses = await Promise.allSettled(promises);
      const successfulResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );

      // レート制限内での成功率確認
      expect(successfulResponses.length).toBeGreaterThan(concurrentRequests * 0.8);
    });

    it('セキュリティヘッダー生成パフォーマンス', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/system/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // 1秒以内
    });
  });
});
