import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestModule } from './test-module';

describe('Test Module Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('CSRF Protection Tests', () => {
    it('should reject requests without CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .send({ name: 'test' })
        .expect(403);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        statusCode: 403,
        timestamp: expect.any(String),
        path: expect.any(String)
      });
    });

    it('should reject requests with invalid CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .set('X-CSRF-Token', 'invalid-token')
        .send({ name: 'test' })
        .expect(403);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        statusCode: 403,
        timestamp: expect.any(String),
        path: expect.any(String)
      });
    });

    it('should accept requests with valid CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .set('X-CSRF-Token', 'valid-csrf-token-123')
        .send({ name: 'test' })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: { name: 'test' }
      });
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should include rate limiting headers', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .set('X-CSRF-Token', 'valid-csrf-token-123')
        .send({ name: 'test' });

      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBe('96');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('CSP Headers Tests', () => {
    it('should include CSP headers', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .set('X-CSRF-Token', 'valid-csrf-token-123')
        .send({ name: 'test' });

      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['content-security-policy']).toContain('nonce-YWJjZGVmZ2hpams=');
      expect(response.headers['x-csp-nonce']).toBe('YWJjZGVmZ2hpams=');
    });
  });

  describe('Input Validation Tests', () => {
    it('should sanitize XSS input', async () => {
      const maliciousInput = '<script>alert("xss")</script><p>Hello</p>';
      
      const response = await request(app.getHttpServer())
        .post('/test/validate-input')
        .set('X-CSRF-Token', 'valid-csrf-token-123')
        .send({ input: maliciousInput })
        .expect(400);

      // XSS input should be rejected with error
      expect(response.body).toMatchObject({
        message: expect.stringContaining('Invalid input detected'),
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test/validate-input'
      });
    });

    it('should detect SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      const response = await request(app.getHttpServer())
        .post('/test/validate-input')
        .set('X-CSRF-Token', 'valid-csrf-token-123')
        .send({ input: sqlInjection })
        .expect(400);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('Invalid input detected'),
        statusCode: 400,
        timestamp: expect.any(String),
        path: expect.any(String)
      });
    });

    it('should accept clean input', async () => {
      const cleanInput = 'Hello, this is a normal message.';
      
      const response = await request(app.getHttpServer())
        .post('/test/validate-input')
        .set('X-CSRF-Token', 'valid-csrf-token-123')
        .send({ input: cleanInput })
        .expect(201);

      expect(response.body.sanitized).toBe(cleanInput);
      expect(response.body.isValid).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    it('should include timestamp and path in error responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/test/protected')
        .send({ name: 'test' })
        .expect(403);

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.path).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });
});
