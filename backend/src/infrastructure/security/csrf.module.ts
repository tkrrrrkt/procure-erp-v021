import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { CsrfService } from './csrf.service';
import { CsrfGuard } from './csrf.guard';
import { CsrfController } from './csrf.controller';

/**
 * CSRF保護モジュール
 * 企業級CSRF保護システムの統合モジュール
 * 
 * Features:
 * - グローバルCSRF保護適用
 * - 自動スケジュールクリーンアップ
 * - 管理API統合
 * - 包括的ログ記録
 */
@Module({
  imports: [
    // スケジュール機能（定期クリーンアップ用）
    ScheduleModule.forRoot(),
  ],
  controllers: [CsrfController],
  providers: [
    CsrfService,
    // グローバルガードとしてCSRF保護を適用
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [CsrfService],
})
export class CsrfModule {
  private readonly logger = new Logger(CsrfModule.name);

  constructor(private readonly csrfService: CsrfService) {
    this.logger.log('CSRF Module initialized successfully');
    
    // 初期化統計情報をログ出力
    this.logInitialStatistics();
  }

  /**
   * 初期化時の統計情報をログ出力
   */
  private logInitialStatistics(): void {
    setTimeout(() => {
      try {
        const stats = this.csrfService.getStatistics();
        this.logger.log('CSRF Protection System Ready', {
          configuration: {
            globalProtection: 'enabled',
            scheduledCleanup: 'enabled',
            managementApi: 'enabled'
          },
          initialStats: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.logger.warn('Failed to log initial statistics', {
          error: error.message
        });
      }
    }, 1000); // 1秒後に実行（初期化完了を待つ）
  }
}
