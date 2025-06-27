import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public, CurrentUser, IAuth0User } from '../../../infrastructure/external-services/auth0/auth0.decorators';
import { ConfigService } from '@nestjs/config';

/**
 * システム運用・監視API
 * エンタープライズSaaSの運用・監視・ヘルスチェックを提供
 * ビジネスドメインから独立したシステムレベルの機能
 */
@ApiTags('System Operations')
@Controller('system')
export class SystemController {
  /**
   * ヘルスチェックエンドポイント
   * ロードバランサー・監視システムからの生死監視用
   */
  @Get('health')
  @Public()
  @ApiOperation({ 
    summary: 'System health check',
    description: 'Returns system health status for load balancers and monitoring systems' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-06-22T13:00:00.000Z',
        service: 'ProcureERP API',
        version: '1.0.0'
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ProcureERP API',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };
  }

  /**
   * システム情報エンドポイント
   * 運用チーム向けシステム基本情報
   */
  @Get('info')
  @Public()
  @ApiOperation({ 
    summary: 'Get system information',
    description: 'Returns basic system information for operations team' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System information',
    schema: {
      example: {
        name: 'ProcureERP API',
        version: '1.0.0',
        environment: 'development',
        nodeVersion: 'v18.17.0',
        timestamp: '2025-06-22T13:00:00.000Z'
      }
    }
  })
  getSystemInfo() {
    return {
      name: 'ProcureERP API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      platform: process.platform,
      architecture: process.arch
    };
  }

  /**
   * 認証済みユーザー情報エンドポイント
   * 認証フロー確認・デバッグ用
   */
  @Get('user/profile')
  @ApiOperation({ 
    summary: 'Get current authenticated user profile',
    description: 'Returns current user profile information for authentication verification' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user profile information',
    schema: {
      example: {
        id: 'user-123',
        email: 'user@company.com',
        tenantId: 'tenant-456',
        permissions: ['read:purchase-requests'],
        auth0Id: 'auth0-789'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  getCurrentUser(@CurrentUser() user: IAuth0User) {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      permissions: user.permissions,
      auth0Id: user.auth0Id,
      timestamp: new Date().toISOString(),
      authProvider: 'Auth0'
    };
  }
}
