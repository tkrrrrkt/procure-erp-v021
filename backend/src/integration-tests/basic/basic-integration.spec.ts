import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Basic Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
    });
  });

  describe('System Info', () => {
    it('should return system information', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/info')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('API Versioning', () => {
    it('should handle API versioning correctly', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should return 405 for invalid HTTP methods', async () => {
      await request(app.getHttpServer())
        .post('/health')
        .expect(405);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS options request', async () => {
      await request(app.getHttpServer())
        .options('/health')
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow normal request rate', async () => {
      // Test normal request rate
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/health')
          .expect(200);
      }
    });

    it('should handle rate limit gracefully', async () => {
      // This test should check rate limiting behavior
      // without actually hitting the limit to avoid flaky tests
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Verify rate limit headers are present
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Input Validation', () => {
    it('should validate request data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send({ invalid: 'data' })
        .expect(400);
    });
  });

  describe('Content Security Policy', () => {
    it('should include CSP headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });
});
