import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  UseGuards, 
  Req, 
  Logger, 
  HttpStatus,
  HttpException,
  ForbiddenException
} from '@nestjs/common';
import { Request } from 'express';

// Auth0認証情報を含むRequestの型拡張
interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    tenant_id?: string;
    tenantId?: string;
    org_id?: string;
    roles?: string[];
    scope?: string;
    [key: string]: any;
  };
}
import { Cron, CronExpression } from '@nestjs/schedule';
import { CsrfService } from './csrf.service';
import { SkipCsrf } from './csrf.guard';
import { Auth0AuthGuard } from '../external-services/auth0/auth0-auth.guard';

/**
 * CSRF管理コントローラー
 * トークン生成、統計情報、ヘルスチェック、クリーンアップ機能を提供
 * 
 * Features:
 * - セキュアなトークン生成API
 * - 統計情報・監視機能
 * - 自動・手動クリーンアップ
 * - 管理者向けメンテナンス機能
 */
@Controller('api/v1/csrf')
@UseGuards(Auth0AuthGuard)
export class CsrfController {
  private readonly logger = new Logger(CsrfController.name);

  constructor(private readonly csrfService: CsrfService) {
    this.logger.log('CSRF Controller initialized');
  }

  /**
   * 新しいCSRFトークンを生成
   */
  @Post('token')
  @SkipCsrf() // トークン生成はCSRFチェックをスキップ
  async generateToken(@Req() request: AuthenticatedRequest): Promise<{
    success: boolean;
    data: {
      token: string;
      expiresAt: number;
      sessionId: string;
      tenantId?: string;
    };
    message: string;
  }> {
    try {
      const user = request.user;
      if (!user) {
        throw new ForbiddenException('Authentication required');
      }

      const sessionId = user.sub;
      const tenantId = this.extractTenantId(request, user);
      const clientIp = this.getClientIp(request);

      const tokenData = await this.csrfService.generateToken(sessionId, tenantId);

      this.logger.log('CSRF token generated via API', {
        sessionId,
        tenantId,
        clientIp,
        expiresAt: new Date(tokenData.expiresAt).toISOString()
      });

      return {
        success: true,
        data: {
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
          sessionId,
          tenantId
        },
        message: 'CSRF token generated successfully'
      };

    } catch (error) {
      this.logger.error('Failed to generate CSRF token via API', {
        error: error.message,
        stack: error.stack
      });

      throw new HttpException(
        'Failed to generate CSRF token',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * CSRF保護統計情報を取得
   */
  @Get('statistics')
  @SkipCsrf()
  async getStatistics(@Req() request: AuthenticatedRequest): Promise<{
    success: boolean;
    data: {
      activeSessions: number;
      totalActiveTokens: number;
      averageTokensPerSession: number;
      memoryUsage: {
        activeTokensSize: number;
        expirationSize: number;
      };
      systemInfo: {
        timestamp: string;
        uptime: number;
        nodeVersion: string;
      };
    };
    message: string;
  }> {
    try {
      const user = request.user;
      const sessionId = user?.sub;
      const clientIp = this.getClientIp(request);

      const stats = this.csrfService.getStatistics();

      this.logger.debug('CSRF statistics requested', {
        sessionId,
        clientIp,
        requestedAt: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          ...stats,
          systemInfo: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            nodeVersion: process.version
          }
        },
        message: 'CSRF statistics retrieved successfully'
      };

    } catch (error) {
      this.logger.error('Failed to retrieve CSRF statistics', {
        error: error.message
      });

      throw new HttpException(
        'Failed to retrieve statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * ヘルスチェック
   */
  @Get('health')
  @SkipCsrf()
  async healthCheck(): Promise<{
    success: boolean;
    data: {
      status: string;
      timestamp: string;
      service: string;
      version: string;
      checks: {
        memory: { status: string; usage: number };
        tokenGeneration: { status: string; responseTime: number };
      };
    };
    message: string;
  }> {
    try {
      const startTime = Date.now();
      
      // メモリ使用量チェック
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      // トークン生成テスト
      const testToken = await this.csrfService.generateToken('health-check', 'test');
      const responseTime = Date.now() - startTime;
      
      // テストトークンをクリーンアップ
      await this.csrfService.clearSessionTokens('health-check');

      const isHealthy = memoryUsagePercent < 90 && responseTime < 100;

      const healthData = {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'CSRF Protection Service',
        version: '1.0.0',
        checks: {
          memory: {
            status: memoryUsagePercent < 90 ? 'ok' : 'warning',
            usage: Math.round(memoryUsagePercent * 100) / 100
          },
          tokenGeneration: {
            status: responseTime < 100 ? 'ok' : 'slow',
            responseTime
          }
        }
      };

      this.logger.debug('CSRF health check completed', healthData);

      return {
        success: true,
        data: healthData,
        message: 'Health check completed'
      };

    } catch (error) {
      this.logger.error('CSRF health check failed', {
        error: error.message
      });

      return {
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'CSRF Protection Service',
          version: '1.0.0',
          checks: {
            memory: { status: 'error', usage: 0 },
            tokenGeneration: { status: 'error', responseTime: 0 }
          }
        },
        message: 'Health check failed'
      };
    }
  }

  /**
   * 期限切れトークンの手動クリーンアップ（管理者用）
   */
  @Delete('cleanup')
  @SkipCsrf()
  async manualCleanup(@Req() request: AuthenticatedRequest): Promise<{
    success: boolean;
    data: {
      cleaned: number;
      remaining: number;
      cleanupTime: string;
    };
    message: string;
  }> {
    try {
      const user = request.user;
      const sessionId = user?.sub;
      const clientIp = this.getClientIp(request);

      // 管理者権限チェック（必要に応じて実装）
      if (!this.isAdminUser(user)) {
        throw new ForbiddenException('Admin privileges required');
      }

      const result = await this.csrfService.cleanupExpiredTokens();

      this.logger.log('Manual CSRF cleanup executed', {
        sessionId,
        clientIp,
        cleanedCount: result.cleaned,
        remainingCount: result.remaining,
        executedAt: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          cleaned: result.cleaned,
          remaining: result.remaining,
          cleanupTime: new Date().toISOString()
        },
        message: `Cleanup completed: ${result.cleaned} tokens removed, ${result.remaining} remaining`
      };

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('Manual CSRF cleanup failed', {
        error: error.message
      });

      throw new HttpException(
        'Cleanup operation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * セッション固有のトークンをクリア
   */
  @Delete('session')
  @SkipCsrf()
  async clearSessionTokens(@Req() request: AuthenticatedRequest): Promise<{
    success: boolean;
    data: {
      sessionId: string;
      clearedAt: string;
    };
    message: string;
  }> {
    try {
      const user = request.user;
      if (!user) {
        throw new ForbiddenException('Authentication required');
      }

      const sessionId = user.sub;
      const clientIp = this.getClientIp(request);

      await this.csrfService.clearSessionTokens(sessionId);

      this.logger.log('Session CSRF tokens cleared', {
        sessionId,
        clientIp,
        clearedAt: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          sessionId,
          clearedAt: new Date().toISOString()
        },
        message: 'Session tokens cleared successfully'
      };

    } catch (error) {
      this.logger.error('Failed to clear session tokens', {
        error: error.message
      });

      throw new HttpException(
        'Failed to clear session tokens',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 定期的な期限切れトークンクリーンアップ（1時間毎）
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledCleanup(): Promise<void> {
    try {
      this.logger.debug('Starting scheduled CSRF token cleanup');
      
      const result = await this.csrfService.cleanupExpiredTokens();
      
      this.logger.log('Scheduled CSRF cleanup completed', {
        cleanedCount: result.cleaned,
        remainingCount: result.remaining,
        executedAt: new Date().toISOString()
      });

      // 統計情報をログ出力
      if (result.cleaned > 0) {
        const stats = this.csrfService.getStatistics();
        this.logger.log('CSRF Service Statistics', {
          activeSessions: stats.activeSessions,
          totalActiveTokens: stats.totalActiveTokens,
          averageTokensPerSession: stats.averageTokensPerSession
        });
      }

    } catch (error) {
      this.logger.error('Scheduled CSRF cleanup failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * テナントIDを抽出
   */
  private extractTenantId(request: AuthenticatedRequest, user: any): string | undefined {
    if (user.tenant_id || user.tenantId) {
      return user.tenant_id || user.tenantId;
    }

    const headerTenantId = request.get('X-Tenant-ID') || request.get('x-tenant-id');
    if (headerTenantId) {
      return headerTenantId;
    }

    if (user.org_id) {
      return user.org_id;
    }

    return undefined;
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
   * 管理者ユーザーかどうかをチェック
   */
  private isAdminUser(user: any): boolean {
    // Auth0のroleやスコープをチェック
    const roles = user.roles || user['https://procure-erp.com/roles'] || [];
    const scopes = user.scope?.split(' ') || [];
    
    return roles.includes('admin') || 
           roles.includes('super-admin') || 
           scopes.includes('admin:csrf');
  }
}
