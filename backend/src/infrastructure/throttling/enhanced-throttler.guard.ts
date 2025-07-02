import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';

// ユーザー情報の型拡張
interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    tenantId?: string;
    permissions?: string[];
  };
}

/**
 * 企業級拡張ThrottlerGuard
 * - 詳細なログ記録
 * - リアルタイム監視
 * - 動的制限調整
 * - テナント別制限
 * - ユーザー別制限
 */
@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(EnhancedThrottlerGuard.name);

  constructor(
    options: any,
    storageService: any,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // システム管理者をスキップ
    if (user?.permissions?.includes('system:admin')) {
      this.logger.debug(`Skipping rate limiting for admin user: ${user.sub}`);
      return true;
    }

    // ヘルスチェックエンドポイントをスキップ
    if (request.path.includes('/health') || request.path.includes('/metrics')) {
      return true;
    }

    // 開発環境でのスキップ設定
    if (
      this.configService.get<string>('NODE_ENV') === 'development' &&
      this.configService.get<boolean>('SKIP_RATE_LIMITING', false)
    ) {
      return true;
    }

    return false;
  }

  protected async generateKeys(
    context: ExecutionContext,
    suffix: string,
    _options: ThrottlerOptions,
  ): Promise<string[]> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // 基本情報の抽出
    const ip = this.getClientIp(request);
    const tenantId = user?.tenantId || this.extractTenantId(request);
    const userId = user?.sub || 'anonymous';

    // 複数のキー戦略を組み合わせ
    const keys: string[] = [];

    // 1. テナント+ユーザー別制限（最も厳しい）
    if (tenantId && userId !== 'anonymous') {
      keys.push(`tenant:${tenantId}:user:${userId}:${suffix}`);
    }

    // 2. テナント別制限
    if (tenantId) {
      keys.push(`tenant:${tenantId}:${suffix}`);
    }

    // 3. ユーザー別制限（ログイン済み）
    if (userId !== 'anonymous') {
      keys.push(`user:${userId}:${suffix}`);
    }

    // 4. IP別制限（フォールバック）
    keys.push(`ip:${ip}:${suffix}`);

    this.logger.debug(`Generated throttle keys for ${request.method} ${request.path}:`, keys);
    return keys;
  }

  // 最新のThrottlerGuard APIに準拠した実装

  private async setRateLimitHeaders(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttlerName: string,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse<Response>();

    // レート制限情報をヘッダーに設定
    response.setHeader('X-RateLimit-Limit', limit.toString());
    response.setHeader('X-RateLimit-Window', ttl.toString());
    response.setHeader('X-RateLimit-Policy', throttlerName);
    response.setHeader('X-RateLimit-Remaining', 'N/A');
  }

  private async handleRateLimitExceeded(
    context: ExecutionContext,
    error: any,
    throttlerName: string,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    // 詳細なエラーログ
    this.logRequest(request, 'RATE_LIMIT_EXCEEDED', {
      throttlerName,
      error: error.message,
    });

    // セキュリティアラート（疑わしい活動の検出）
    await this.checkForSuspiciousActivity(request);

    // エラーレスポンスヘッダー
    response.setHeader('Retry-After', '60'); // 60秒後に再試行
  }

  private getClientIp(request: AuthenticatedRequest): string {
    return (
      request.ip ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  }

  private extractTenantId(request: AuthenticatedRequest): string | null {
    // ヘッダーからテナントIDを抽出
    const tenantHeader = this.configService.get<string>('TENANT_HEADER_NAME', 'X-Tenant-ID');
    const headerValue = request.headers[tenantHeader.toLowerCase()];
    return (Array.isArray(headerValue) ? headerValue[0] : headerValue) || null;
  }

  private logRequest(
    request: AuthenticatedRequest,
    status: 'SUCCESS' | 'RATE_LIMIT_EXCEEDED',
    metadata: any,
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      ip: this.getClientIp(request),
      userAgent: request.get('user-agent'),
      user: request.user?.sub || 'anonymous',
      tenant: this.extractTenantId(request),
      status,
      ...metadata,
    };

    if (status === 'SUCCESS') {
      this.logger.debug('Rate limit check passed', logData);
    } else {
      this.logger.warn('Rate limit exceeded', logData);
    }
  }

  private async checkForSuspiciousActivity(request: AuthenticatedRequest): Promise<void> {
    // 短時間での大量リクエストを検出
    const ip = this.getClientIp(request);
    const user = request.user?.sub || 'anonymous';

    // アラート条件をチェック
    // 実装は監視システムと連携
    this.logger.warn(`Potential suspicious activity detected`, {
      ip,
      user,
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * カスタムエラーメッセージ生成
   */
  protected async getErrorMessage(context: ExecutionContext): Promise<string> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isAuthenticated = !!request.user;

    if (isAuthenticated) {
      return 'Rate limit exceeded. Please wait before making more requests.';
    } else {
      return 'Too many requests from this IP. Please try again later.';
    }
  }
}
