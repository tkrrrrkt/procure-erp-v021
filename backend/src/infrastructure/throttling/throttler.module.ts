import { Module, Global } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EnhancedThrottlerGuard } from './enhanced-throttler.guard';
import { ThrottlerStorageRedisService } from './throttler-storage-redis.service';

@Global()
@Module({
  imports: [
    // 動的な多層レート制限設定
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // 複数の時間窓でレート制限を実装
        throttlers: [
          {
            name: 'short',
            ttl: configService.get<number>('THROTTLE_SHORT_TTL', 10) * 1000, // 10秒
            limit: configService.get<number>('THROTTLE_SHORT_LIMIT', 20), // 20回
          },
          {
            name: 'medium',
            ttl: configService.get<number>('THROTTLE_MEDIUM_TTL', 60) * 1000, // 1分
            limit: configService.get<number>('THROTTLE_MEDIUM_LIMIT', 100), // 100回
          },
          {
            name: 'long',
            ttl: configService.get<number>('THROTTLE_LONG_TTL', 3600) * 1000, // 1時間
            limit: configService.get<number>('THROTTLE_LONG_LIMIT', 1000), // 1000回
          },
        ],
        // カスタムストレージ（Redis）
        storage: new ThrottlerStorageRedisService(configService),
        // エラーメッセージ
        errorMessage: 'Rate limit exceeded. Please try again later.',
        // スキップ条件
        skipIf: (context) => {
          const request = context.switchToHttp().getRequest();
          // システム管理者はスキップ
          return request.user?.permissions?.includes('system:admin') || false;
        },
      }),
    }),
  ],
  providers: [
    ThrottlerStorageRedisService,
    {
      provide: APP_GUARD,
      useClass: EnhancedThrottlerGuard,
    },
  ],
  exports: [NestThrottlerModule, ThrottlerStorageRedisService],
})
export class ThrottlerModule {}
