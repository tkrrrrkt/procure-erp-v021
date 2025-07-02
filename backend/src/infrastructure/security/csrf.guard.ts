import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

// Auth0認証情報を含むRequestの型拡張
interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    tenant_id?: string;
    tenantId?: string;
    org_id?: string;
    roles?: string[];
    scope?: string;
    [key: string]: any;
  };
}
import { CsrfService } from './csrf.service';

// デコレータキー定義
export const SKIP_CSRF_KEY = 'skipCsrf';
export const PUBLIC_KEY = 'isPublic';

// デコレータ定義
export const SkipCsrf = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Reflect.defineMetadata(SKIP_CSRF_KEY, true, descriptor.value);
  } else {
    Reflect.defineMetadata(SKIP_CSRF_KEY, true, target);
  }
};

export const Public = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Reflect.defineMetadata(PUBLIC_KEY, true, descriptor.value);
  } else {
    Reflect.defineMetadata(PUBLIC_KEY, true, target);
  }
};

/**
 * 企業級CSRFガード
 * Auth0統合、マルチテナント対応、詳細セキュリティログ機能付き
 * 
 * Features:
 * - 自動CSRF保護適用
 * - 安全なHTTPメソッドのスキップ
 * - 明示的なスキップ設定対応
 * - 自動トークン更新
 * - 詳細違反ログ記録
 * - Multi-tenant対応
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  
  // 安全なHTTPメソッド（CSRF保護不要）
  private readonly safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
  
  // 保護対象外パス（正規表現）
  private readonly excludedPaths = [
    /^\/api\/v1\/auth\/callback/,     // Auth0コールバック
    /^\/api\/v1\/webhooks\//,         // Webhook エンドポイント
    /^\/api\/v1\/health/,             // ヘルスチェック
    /^\/api\/v1\/metrics/,            // メトリクス
    /^\/api\/v1\/csrf\/token/,        // CSRFトークン取得
  ];

  constructor(
    private readonly csrfService: CsrfService,
    private readonly reflector: Reflector
  ) {
    this.logger.log('CSRF Guard initialized');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controllerClass = context.getClass();

    try {
      // 基本情報取得
      const method = request.method.toUpperCase();
      const path = request.path;
      const userAgent = request.get('user-agent') || 'unknown';
      const clientIp = this.getClientIp(request);

      this.logger.debug('CSRF Guard processing request', {
        method,
        path,
        clientIp,
        userAgent: userAgent.substring(0, 100) + '...'
      });

      // 1. 安全なHTTPメソッドはスキップ
      if (this.safeMethods.has(method)) {
        this.logger.debug('Safe HTTP method, skipping CSRF protection', {
          method,
          path
        });
        return true;
      }

      // 2. 明示的なスキップ設定チェック
      const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
        handler,
        controllerClass,
      ]);

      if (skipCsrf) {
        this.logger.debug('CSRF protection explicitly skipped', {
          method,
          path
        });
        return true;
      }

      // 3. パブリックエンドポイントはスキップ
      const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
        handler,
        controllerClass,
      ]);

      if (isPublic) {
        this.logger.debug('Public endpoint, skipping CSRF protection', {
          method,
          path
        });
        return true;
      }

      // 4. 除外パスチェック
      if (this.isExcludedPath(path)) {
        this.logger.debug('Excluded path, skipping CSRF protection', {
          method,
          path
        });
        return true;
      }

      // 5. ユーザー認証情報取得
      const user = request.user;
      if (!user) {
        this.logger.warn('CSRF protection attempted on unauthenticated request', {
          method,
          path,
          clientIp
        });
        throw new ForbiddenException('Authentication required for CSRF protection');
      }

      // 6. セッション・テナント情報取得
      const sessionId = user.sub; // Auth0のユーザーID
      const tenantId = this.extractTenantId(request, user);

      // 7. CSRFトークン取得
      const csrfToken = this.extractCsrfToken(request);
      
      if (!csrfToken) {
        this.logSecurityViolation('Missing CSRF token', {
          method,
          path,
          sessionId,
          tenantId,
          clientIp,
          userAgent
        });
        throw new ForbiddenException('CSRF token required');
      }

      // 8. CSRFトークン検証
      const validation = await this.csrfService.validateToken(csrfToken, sessionId, tenantId);
      
      if (!validation.isValid) {
        this.logSecurityViolation('Invalid CSRF token', {
          method,
          path,
          sessionId,
          tenantId,
          clientIp,
          userAgent,
          reason: validation.reason
        });
        throw new ForbiddenException(`CSRF token validation failed: ${validation.reason}`);
      }

      // 9. 新しいCSRFトークンを生成してレスポンスヘッダーに設定
      const newToken = await this.csrfService.generateToken(sessionId, tenantId);
      response.setHeader('X-CSRF-Token', newToken.token);
      response.setHeader('X-CSRF-Token-Expires', newToken.expiresAt.toString());

      this.logger.debug('CSRF protection successful', {
        method,
        path,
        sessionId,
        tenantId,
        newTokenExpires: new Date(newToken.expiresAt).toISOString()
      });

      return true;

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('CSRF Guard execution error', {
        error: error.message,
        method: request.method,
        path: request.path,
        stack: error.stack
      });

      throw new ForbiddenException('CSRF protection error');
    }
  }

  /**
   * リクエストからCSRFトークンを抽出
   */
  private extractCsrfToken(request: AuthenticatedRequest): string | null {
    // 1. カスタムヘッダーから取得
    const headerToken = request.get('X-CSRF-Token') || request.get('x-csrf-token');
    if (headerToken) {
      return headerToken;
    }

    // 2. リクエストボディから取得
    const bodyToken = request.body?._csrf || request.body?.csrfToken;
    if (bodyToken) {
      return bodyToken;
    }

    // 3. クエリパラメータから取得
    const queryToken = request.query._csrf || request.query.csrfToken;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * テナントIDを抽出
   */
  private extractTenantId(request: AuthenticatedRequest, user: any): string | undefined {
    // 1. ユーザークレームから取得
    if (user.tenant_id || user.tenantId) {
      return user.tenant_id || user.tenantId;
    }

    // 2. カスタムヘッダーから取得
    const headerTenantId = request.get('X-Tenant-ID') || request.get('x-tenant-id');
    if (headerTenantId) {
      return headerTenantId;
    }

    // 3. リクエストボディから取得
    const bodyTenantId = request.body?.tenantId;
    if (bodyTenantId) {
      return bodyTenantId;
    }

    // 4. Auth0のorganization情報から取得
    if (user.org_id) {
      return user.org_id;
    }

    return undefined;
  }

  /**
   * 除外パスかどうかをチェック
   */
  private isExcludedPath(path: string): boolean {
    return this.excludedPaths.some(pattern => pattern.test(path));
  }

  /**
   * クライアントIPアドレスを取得
   */
  private getClientIp(request: AuthenticatedRequest): string {
    const forwarded = request.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIp = request.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
    
    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  /**
   * セキュリティ違反をログ記録
   */
  private logSecurityViolation(type: string, details: any): void {
    this.logger.warn(`CSRF Security Violation: ${type}`, {
      violationType: type,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      ...details
    });

    // 必要に応じて外部監視システムに通知
    // this.notificationService.sendSecurityAlert(type, details);
  }
}
