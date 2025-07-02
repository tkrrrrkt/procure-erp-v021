import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrismaMockService } from './prisma-mock.service';

/**
 * テスト専用データベースモジュール
 * 実際のデータベース接続を Mock に置き換える
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test.local',
    }),
  ],
  providers: [
    {
      provide: PrismaService,
      useClass: PrismaMockService,
    },
  ],
  exports: [PrismaService],
})
export class TestDatabaseModule {}
