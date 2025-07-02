import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';

import { CsrfService } from '../../infrastructure/security/csrf.service';
import { SanitizerService } from '../../infrastructure/validation/sanitizer.service';
import { CspService } from '../../infrastructure/security/csp.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TestController } from '../mocks/test-module';

/**
 * 基盤システム セキュリティ統合テストスイート
 * 
 * 企業級セキュリティ基盤の包括的テスト
 * - CSRF保護統合テスト
 * - APIレート制限統合テスト
 * - 入力検証・サニタイゼーション統合テスト
 * - CSPセキュリティヘッダー統合テスト
 * - マルチテナント分離テスト
 */
describe('基盤システム セキュリティ統合テスト', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let csrfService: CsrfService;
  let sanitizerService: SanitizerService;
  let cspService: CspService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [
        TestController,
      ],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $connect: jest.fn(),
            $disconnect: jest.fn(),
            tenant: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: CsrfService,
          useValue: {
            generateToken: jest.fn().mockImplementation(async (sessionId, tenantId) => ({
              token: `mock-csrf-token-${Date.now()}`,
              expiresAt: Date.now() + 60000,
            })),
            validateToken: jest.fn().mockImplementation(async (token, sessionId, tenantId) => ({
              isValid: token.startsWith('mock-csrf-token'),
              error: token.startsWith('mock-csrf-token') ? null : 'Invalid token',
            })),
          },
        },
        {
          provide: SanitizerService,
          useValue: {
            sanitize: jest.fn().mockImplementation((input) => input),
            isClean: jest.fn().mockReturnValue(true),
            sanitizeHtml: jest.fn().mockImplementation((input: string) => {
              return input
                .replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<img[^>]*>/gi, '')
                .replace(/javascript:/gi, '');
            }),
            validateInput: jest.fn().mockImplementation((input: string) => {
              const maliciousPatterns = [
                /<script/i,
                /javascript:/i,
                /<img/i,
                /union.*select/i,
                /drop.*table/i,
                /insert.*into/i
              ];
              return !maliciousPatterns.some(pattern => pattern.test(input));
            }),
          },
        },
        {
          provide: CspService,
          useValue: {
            generateCspHeader: jest.fn().mockImplementation(() => ({
              policy: "default-src 'self'; script-src 'self' 'nonce-mock-nonce'",
              nonce: 'mock-nonce',
            })),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Get service instances
    prismaService = app.get<PrismaService>(PrismaService);
    csrfService = app.get<CsrfService>(CsrfService);
    sanitizerService = app.get<SanitizerService>(SanitizerService);
    cspService = app.get<CspService>(CspService);
    configService = app.get<ConfigService>(ConfigService);

    // Add security middleware
    app.use((req: any, res: any, next: any) => {
      // Basic security headers
      res.header('X-Frame-Options', 'DENY');
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-XSS-Protection', '1; mode=block');
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // CSP headers
      const cspResult = cspService.generateCspHeader();
      if (cspResult.policy) {
        res.header('Content-Security-Policy', cspResult.policy);
      }
      if (cspResult.nonce) {
        res.header('X-CSP-Nonce', cspResult.nonce);
      }
      
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🛡️ CSRF保護統合テスト', () => {
    let csrfToken: string;

    beforeEach(async () => {
      // Generate CSRF token for tests
      const sessionId = 'test-session-123';
      const tenantId = 'test-tenant-456';
      const tokenResult = await csrfService.generateToken(sessionId, tenantId);
      csrfToken = tokenResult.token;
    });

    it('有効なCSRFトークンで保護されたエンドポイントへのアクセス成功', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('無効なCSRFトークンで保護されたエンドポイントへのアクセス拒否', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .set('X-CSRF-Token', 'invalid-token')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });

    it('CSRFトークン無しで保護されたエンドポイントへのアクセス拒否', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });

    it('CSRFトークンの生成と検証が正常動作', async () => {
      const sessionId = 'test-session-789';
      const tenantId = 'test-tenant-789';

      // Token generation
      const tokenResult = await csrfService.generateToken(sessionId, tenantId);
      expect(tokenResult).toBeDefined();
      expect(tokenResult.token).toBeDefined();
      expect(typeof tokenResult.token).toBe('string');
      expect(tokenResult.token.length).toBeGreaterThan(0);
      expect(tokenResult.expiresAt).toBeGreaterThan(Date.now());

      // Token validation
      const validationResult = await csrfService.validateToken(tokenResult.token, sessionId, tenantId);
      expect(validationResult.isValid).toBe(true);
    });

    it('期限切れCSRFトークンの検証失敗', async () => {
      const sessionId = 'test-session-expired';
      const tenantId = 'test-tenant-expired';

      // Create expired token (mock by manipulating service)
      const expiredToken = 'expired-token-mock';
      
      const validationResult = await csrfService.validateToken(expiredToken, sessionId, tenantId);
      expect(validationResult.isValid).toBe(false);
    });
  });

  describe('⚡ APIレート制限統合テスト', () => {
    it('レート制限内での連続リクエスト成功', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .get('/test/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach((response, index) => {
        expect(response.body.status).toBe('OK');
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
      });
    });

    it('レート制限ヘッダーの正確な設定', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/health')
        .expect(200);

      // Rate limit headers should be present
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      
      // Values should be numeric strings
      expect(Number(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
      expect(Number(response.headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
      expect(Number(response.headers['x-ratelimit-reset'])).toBeGreaterThan(0);
    });

    it('高頻度リクエストでのレート制限適用（段階的テスト）', async () => {
      const rapidRequests = [];
      
      // Send requests rapidly but within limit
      for (let i = 0; i < 10; i++) {
        rapidRequests.push(
          request(app.getHttpServer())
            .get('/test/health')
            .expect(200)
        );
      }

      const responses = await Promise.all(rapidRequests);
      
      // All should succeed within limit
      responses.forEach(response => {
        expect(response.body.status).toBe('OK');
      });

      // Check that remaining count decreases
      const remainingCounts = responses.map(r => 
        Number(r.headers['x-ratelimit-remaining'])
      );
      
      // Remaining should generally decrease (allowing for some variation due to timing)
      expect(remainingCounts[0]).toBeGreaterThanOrEqual(remainingCounts[remainingCounts.length - 1]);
    });
  });

  describe('🧹 入力検証・サニタイゼーション統合テスト', () => {
    it('XSS攻撃コードのサニタイゼーション', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      for (const maliciousInput of maliciousInputs) {
        const sanitized = sanitizerService.sanitizeHtml(maliciousInput);
        
        // Should not contain script tags or javascript protocols
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
        expect(sanitized).not.toContain('<iframe');
      }
    });

    it('SQLインジェクション攻撃コードの検出', async () => {
      const sqlInjectionInputs = [
        "'; DROP TABLE users; --",
        "1 OR 1=1",
        "admin'; --",
        "' UNION SELECT * FROM users --"
      ];

      for (const maliciousInput of sqlInjectionInputs) {
        const isSafe = sanitizerService.validateInput(maliciousInput);
        expect(isSafe).toBe(false);
      }
    });

    it('正常な入力の通過許可', async () => {
      const validInputs = [
        'John Doe',
        'user@example.com',
        '123 Main Street',
        'Product Name - Version 1.0'
      ];

      for (const validInput of validInputs) {
        const sanitized = sanitizerService.sanitizeHtml(validInput);
        expect(sanitized).toBe(validInput);
        
        const isValid = sanitizerService.validateInput(validInput);
        expect(isValid).toBe(true);
      }
    });

    it('APIエンドポイントでの自動入力検証', async () => {
      const maliciousPayload = {
        name: '<script>alert("xss")</script>',
        email: 'user@example.com',
        description: '<img src="x" onerror="alert(1)">'
      };

      const response = await request(app.getHttpServer())
        .post('/test/validate-input')
        .send(maliciousPayload)
        .expect(400); // Should be rejected due to validation

      expect(response.body.error).toContain('validation');
    });
  });

  describe('🔒 CSPセキュリティヘッダー統合テスト', () => {
    it('CSPヘッダーの正確な設定', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/health')
        .expect(200);

      // CSP header should be present
      expect(response.headers['content-security-policy']).toBeDefined();
      
      const cspHeader = response.headers['content-security-policy'];
      
      // Should contain essential directives
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("style-src 'self'");
      expect(cspHeader).toContain("img-src 'self'");
    });

    it('Nonce生成と設定', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/health')
        .expect(200);

      // Nonce header should be present
      expect(response.headers['x-csp-nonce']).toBeDefined();
      
      const nonce = response.headers['x-csp-nonce'];
      expect(nonce).toMatch(/^[a-zA-Z0-9+/]+=*$/); // Base64 format
      expect(nonce.length).toBeGreaterThan(16);
    });

    it('セキュリティヘッダーの包括的設定', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/health')
        .expect(200);

      // All essential security headers
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });
  });

  describe('🏢 マルチテナント分離テスト', () => {
    it('テナント分離の基本検証', async () => {
      // Mock different tenants
      const tenant1 = { id: 'tenant-1', code: 'COMPANY_A' };
      const tenant2 = { id: 'tenant-2', code: 'COMPANY_B' };

      // Mock Prisma responses for different tenants
      (prismaService.tenant.findUnique as jest.Mock)
        .mockResolvedValueOnce(tenant1)
        .mockResolvedValueOnce(tenant2);

      // Test tenant isolation
      const response1 = await request(app.getHttpServer())
        .get('/test/tenant-info')
        .set('X-Tenant-ID', tenant1.id)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/test/tenant-info')
        .set('X-Tenant-ID', tenant2.id)
        .expect(200);

      expect(response1.body.tenantId).toBe(tenant1.id);
      expect(response2.body.tenantId).toBe(tenant2.id);
      expect(response1.body.tenantId).not.toBe(response2.body.tenantId);
    });

    it('無効なテナントIDでのアクセス拒否', async () => {
      (prismaService.tenant.findUnique as jest.Mock)
        .mockResolvedValueOnce(null);

      const response = await request(app.getHttpServer())
        .get('/test/tenant-info')
        .set('X-Tenant-ID', 'invalid-tenant')
        .expect(403);

      expect(response.body.error).toContain('tenant');
    });
  });

  describe('🚀 パフォーマンス・安定性テスト', () => {
    it('同時リクエスト処理の安定性', async () => {
      const concurrentRequests = 20;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/test/health')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.status).toBe('OK');
      });

      // All responses should be successful
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
      });
      
      // Basic performance check - no individual response should take too long
      // Note: We don't have direct access to response time in supertest
    });

    it('メモリリーク防止の検証', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .get('/test/health')
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      
      // Memory growth should be reasonable
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });
  });

  describe('🔍 監視・ログ統合テスト', () => {
    it('構造化ログ出力の検証', async () => {
      // Capture console output
      const logMessages: any[] = [];
      const originalLog = console.log;
      console.log = jest.fn((message) => {
        logMessages.push(message);
        originalLog(message);
      });

      await request(app.getHttpServer())
        .get('/test/health')
        .expect(200);

      // Restore console.log
      console.log = originalLog;

      // Should have structured log messages
      expect(logMessages.length).toBeGreaterThan(0);
    });

    it('エラーハンドリングと適切なHTTPステータス', async () => {
      const response = await request(app.getHttpServer())
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });
});
