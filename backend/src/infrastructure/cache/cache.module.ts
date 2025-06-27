import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get<number>('REDIS_TTL', 3600) * 1000, // milliseconds
        max: 100,
        // Note: Redis store configuration will be added when needed
        // For now, using in-memory cache
      }),
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
