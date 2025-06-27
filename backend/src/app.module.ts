import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure modules
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { Auth0AuthModule } from './infrastructure/external-services/auth0/auth0-auth.module';

// Shared modules
import { SharedModule } from './shared-kernel/shared.module';

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
    }),

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
