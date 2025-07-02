import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CqrsModule } from '@nestjs/cqrs';
import * as Joi from 'joi';

// Infrastructure modules
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { Auth0AuthModule } from './infrastructure/external-services/auth0/auth0-auth.module';
import { ThrottlerModule } from './infrastructure/throttling/throttler.module';
import { CsrfModule } from './infrastructure/security/csrf.module';
import { CspModule } from './infrastructure/security/csp.module';

// Shared modules
import { SharedModule } from './shared-kernel/shared.module';
import { ValidationModule } from './shared-kernel/validation/validation.module';

// REST controllers
import { SystemController } from './presentation/rest/shared/system.controller';
import { UserProfileController } from './presentation/rest/user/user-profile.controller';

// Global providers
import { Auth0AuthGuard } from './infrastructure/external-services/auth0/auth0-auth.guard';
import { TenantInterceptor } from './infrastructure/interceptors/tenant.interceptor';
import { AuditLogInterceptor } from './infrastructure/interceptors/audit-log.interceptor';
import { GlobalExceptionFilter } from './infrastructure/filters/global-exception.filter';

// Application services
import { UserSyncService } from './application/services/user-sync.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        CORS_ORIGIN: Joi.string().default('http://localhost:3001'),
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        REDIS_URL: Joi.string().optional(),
        // Rate Limiting Configuration
        THROTTLE_SHORT_TTL: Joi.number().default(10),
        THROTTLE_SHORT_LIMIT: Joi.number().default(20),
        THROTTLE_MEDIUM_TTL: Joi.number().default(60),
        THROTTLE_MEDIUM_LIMIT: Joi.number().default(100),
        THROTTLE_LONG_TTL: Joi.number().default(3600),
        THROTTLE_LONG_LIMIT: Joi.number().default(1000),
        SKIP_RATE_LIMITING: Joi.boolean().default(false),
        // CSRF Protection Configuration
        CSRF_SECRET: Joi.string().min(32).required(),
        CSRF_TOKEN_TTL: Joi.number().default(86400000), // 24 hours
        CSRF_MAX_TOKENS_PER_SESSION: Joi.number().default(10),
        // Input Validation Configuration
        INPUT_MAX_LENGTH: Joi.number().default(1000),
        // CSP Configuration
        CSP_ENABLED: Joi.boolean().default(true),
        CSP_REPORT_ONLY: Joi.boolean().default(false),
        CSP_REPORT_URI: Joi.string().optional(),
        CSP_ALLOWED_DOMAINS: Joi.string().optional(),
        CSP_ENFORCE_HTTPS: Joi.boolean().default(true),
        AUTH0_DOMAIN: Joi.string().optional(),
      }),
    }),

    // Rate Limiting - 最優先で配置
    ThrottlerModule,

    // CSRF Protection - レート制限の後、認証の前に配置
    CsrfModule,

    // Content Security Policy - セキュリティヘッダー管理
    CspModule,

    // Event handling
    EventEmitterModule.forRoot(),

    // CQRS
    CqrsModule,

    // Infrastructure
    DatabaseModule,
    CacheModule,
    Auth0AuthModule,

    // Shared
    SharedModule,
    ValidationModule,
  ],
  controllers: [
    // System-level controllers
    SystemController,

    // User management controllers
    UserProfileController, // ユーザープロファイルAPI統合
  ],
  providers: [
    // Application services
    UserSyncService,

    // 認証・認可プロバイダー
    {
      provide: APP_GUARD,
      useClass: Auth0AuthGuard, // グローバル認証ガード設定
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
