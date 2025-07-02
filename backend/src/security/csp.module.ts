import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CspService } from './csp.service';

/**
 * Content Security Policy (CSP) Module
 * 
 * Provides enterprise-grade CSP functionality including:
 * - Dynamic CSP header generation with nonce-based policies
 * - Environment-driven configuration
 * - CSP violation reporting
 * - Comprehensive security headers
 */
@Module({
  imports: [ConfigModule],
  providers: [CspService],
  exports: [CspService],
})
export class CspModule {}
