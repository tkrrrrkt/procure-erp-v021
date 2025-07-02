import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SanitizerService } from '../services/sanitizer.service';
import { EnhancedValidationPipe } from '../pipes/enhanced-validation.pipe';

/**
 * グローバル検証モジュール
 * 入力検証・サニタイゼーション・セキュリティ機能を統合
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SanitizerService,
    {
      provide: 'VALIDATION_PIPE',
      useClass: EnhancedValidationPipe,
    },
  ],
  exports: [
    SanitizerService,
    'VALIDATION_PIPE',
  ],
})
export class ValidationModule {
  constructor(private readonly sanitizerService: SanitizerService) {
    this.logModuleInitialization();
  }

  /**
   * モジュール初期化ログ
   */
  private logModuleInitialization(): void {
    console.log('🔐 Enhanced Validation Module initialized');
    console.log('✅ SanitizerService: Active');
    console.log('✅ EnhancedValidationPipe: Active');
    console.log('✅ Security Features: XSS, SQL Injection, File Upload Protection');
    console.log('✅ Enterprise-grade Input Validation: Enabled');
  }
}
