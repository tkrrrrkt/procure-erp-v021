import { Module, Controller, Get, Post, Body, Headers, Req, BadRequestException, ForbiddenException, UseGuards, NestMiddleware, MiddlewareConsumer, RequestMethod, Inject } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { Request, Response, NextFunction } from 'express';
import { CsrfGuard } from '../../infrastructure/security/csrf.guard';
import { CsrfService } from '../../infrastructure/security/csrf.service';
import { EnhancedThrottlerGuard } from '../../infrastructure/throttling/enhanced-throttler.guard';

// Mock services for testing
class MockUserSyncService {
  async syncUser(user: any) {
    return { id: 'test-user-id', tenantId: 'test-tenant-id' };
  }
}

class MockPrismaService {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  
  tenant = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  $disconnect = jest.fn();
}

class MockCacheService {
  get = jest.fn();
  set = jest.fn();
  del = jest.fn();
}

class MockRedisService {
  get = jest.fn();
  set = jest.fn();
  del = jest.fn();
  incr = jest.fn();
  expire = jest.fn();
  ttl = jest.fn();
}

class MockCsrfService {
  generateToken = jest.fn().mockImplementation(async (sessionId, tenantId) => {
    return {
      token: `mock-csrf-token-${Date.now()}`,
      expiresAt: Date.now() + 60000 // 1 minute from now
    };
  });
  validateToken = jest.fn().mockImplementation(async (token, sessionId, tenantId) => {
    // Strictly validate CSRF tokens for testing
    if (!token) {
      return {
        isValid: false,
        error: 'CSRF token is required'
      };
    }
    
    // Only accept tokens that start with 'valid-csrf-token'
    const isValid = token.startsWith('valid-csrf-token');
    return {
      isValid,
      error: isValid ? null : 'Invalid CSRF token'
    };
  });
  getStatistics = jest.fn().mockReturnValue({
    totalTokensGenerated: 0,
    totalTokensValidated: 0,
    totalTokensExpired: 0,
  });
  cleanup = jest.fn();
}

class MockSanitizerService {
  sanitizeHtml = jest.fn().mockImplementation((input: string) => {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<img[^>]*>/gi, '')
      .replace(/<svg[^>]*>.*?<\/svg>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+\s*=["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\S+/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');
  });
  
  sanitizeText = jest.fn((input: string) => input);
  sanitizeFilename = jest.fn((input: string) => input);
  
  validateInput = jest.fn((input: string) => {
    // Simulate input validation - stricter SQL injection detection
    const maliciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /<img[^>]*>/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+.*set/i,
      /or\s+1\s*=\s*1/i,
      /or\s+'1'\s*=\s*'1'/i,
      /'\s+or\s+'/i,
      /--/,
      /\/\*.*\*\//
    ];
    return !maliciousPatterns.some(pattern => pattern.test(input));
  });

  sanitize = jest.fn((input: any) => input);
  isClean = jest.fn().mockReturnValue(true);
}

class MockCspService {
  generateNonce = jest.fn().mockReturnValue('YUJjZEVmR2hJams='); // Base64 encoded nonce
  generatePolicy = jest.fn().mockReturnValue("default-src 'self'");
  generateCspHeader = jest.fn().mockImplementation(() => {
    const mockNonce = 'YUJjZEVmR2hJams=';
    return {
      policy: `default-src 'self'; script-src 'self' 'nonce-${mockNonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'`,
      nonce: mockNonce
    };
  });
}

// Test Controller for security endpoints
@Controller('test')
export class TestController {
  constructor(@Inject('SanitizerService') private readonly sanitizerService: MockSanitizerService) {}

  @Post('protected')
  async protectedEndpoint(@Body() body: any) {
    return { success: true, data: body };
  }

  @Post('validate-input')
  async validateInput(@Body() body: any) {
    const input = body.input || JSON.stringify(body);
    
    // Validate input using SanitizerService
    const isValid = this.sanitizerService.validateInput(input);
    
    if (!isValid) {
      throw new BadRequestException({
        message: 'Invalid input detected - contains malicious patterns',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: '/test/validate-input'
      });
    }
    
    // Sanitize the input
    const sanitized = this.sanitizerService.sanitizeHtml(input);
    
    return { 
      success: true, 
      isValid: true,
      sanitized: sanitized,
      original: input
    };
  }

  @Get('tenant-info')
  async getTenantInfo(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId || tenantId === 'invalid-tenant') {
      throw new ForbiddenException({
        error: 'Invalid tenant access',
        timestamp: new Date().toISOString(),
        path: '/test/tenant-info'
      });
    }
    
    return {
      tenantId,
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  @Get('health')
  async health() {
    // Log for structured logging test
    console.log(JSON.stringify({
      level: 'info',
      message: 'Health check accessed',
      timestamp: new Date().toISOString(),
      service: 'test-controller'
    }));
    
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([
        {
          ttl: 60000,
          limit: 100,
        },
      ]),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [TestController],
  providers: [
    {
      provide: 'UserSyncService',
      useClass: MockUserSyncService,
    },
    {
      provide: 'PrismaService',
      useClass: MockPrismaService,
    },
    {
      provide: 'CacheService',
      useClass: MockCacheService,
    },
    {
      provide: CsrfService,
      useClass: MockCsrfService,
    },
    {
      provide: 'SanitizerService',
      useClass: MockSanitizerService,
    },
    {
      provide: 'CspService',
      useClass: MockCspService,
    },
    {
      provide: 'REDIS_CLIENT',
      useClass: MockRedisService,
    },

    {
      provide: APP_GUARD,
      useClass: EnhancedThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [
    'UserSyncService',
    'PrismaService', 
    'CacheService',
    'SanitizerService',
    'CspService',
  ],
})
export class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TestSecurityMiddleware)
      .forRoutes('*');
  }
}

// Test middleware to add CSP headers and rate limit headers
class TestSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Add mock user for CSRF protection testing
    (req as any).user = {
      sub: 'test-user-123',
      tenantId: 'tenant-123',
      permissions: ['read', 'write']
    };
    
    // Add security headers
    res.setHeader('X-Rate-Limit-Limit', '100');
    res.setHeader('X-Rate-Limit-Remaining', '99');
    res.setHeader('X-Rate-Limit-Reset', Math.floor(Date.now() / 1000) + 3600);
    
    // Add CSP header with Base64 nonce
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'nonce-YWJjZGVmZ2hpams='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.example.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'");
    res.setHeader('X-CSP-Nonce', 'YWJjZGVmZ2hpams=');
    
    // Override res.json to add timestamp and path to all responses
    const originalJson = res.json;
    const originalStatus = res.status;
    
    res.json = function(data: any) {
      if (data && typeof data === 'object') {
        // Add timestamp and path for error responses
        if ((data.statusCode && data.statusCode >= 400) || res.statusCode >= 400) {
          data.timestamp = new Date().toISOString();
          data.path = req.path;
        }
      }
      return originalJson.call(this, data);
    };
    
    res.status = function(code: number) {
      return originalStatus.call(this, code);
    };
    
    next();
  }
}

export {
  MockUserSyncService,
  MockPrismaService,
  MockCacheService,
  MockCsrfService,
  MockSanitizerService,
  MockCspService,
};
