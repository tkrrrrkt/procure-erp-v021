import { Controller, Get, Put, Body, UseGuards, Logger, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Auth0AuthGuard } from '../../../infrastructure/external-services/auth0/auth0-auth.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../../infrastructure/external-services/auth0/current-user.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { EnhancedValidationPipe } from '../../../shared-kernel/pipes/enhanced-validation.pipe';
import { SanitizerService } from '../../../shared-kernel/services/sanitizer.service';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller('system/user')
@UseGuards(Auth0AuthGuard)
export class UserProfileController {
  private readonly logger = new Logger(UserProfileController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sanitizerService: SanitizerService,
  ) {}

  /**
   * 現在認証されているユーザーの完全プロファイル取得
   */
  @Get('profile')
  async getCurrentUserProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      data: {
        // Auth0ユーザー情報
        id: user.sub,
        auth0UserId: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,

        // 権限・スコープ情報
        roles: user.roles,
        permissions: user.permissions,
        scope: user.scope,
        organization: user.organization,

        // セッション情報
        sessionInfo: {
          loginProvider: 'AUTH0',
          tenantIsolated: true,
          multiFactorEnabled: true,
        },
      },
    };
  }

  /**
   * ユーザーの承認状態確認
   */
  @Get('approval-status')
  async getApprovalStatus(@CurrentUser() user: AuthenticatedUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        app_approved: true,
        approved_by: true,
        approved_at: true,
        status: true,
        created_at: true,
      },
    });

    return {
      success: true,
      data: {
        isApproved: dbUser?.app_approved || false,
        approvedBy: dbUser?.approved_by,
        approvedAt: dbUser?.approved_at,
        status: dbUser?.status,
        canAccessApplication: dbUser?.app_approved || false,
        registeredAt: dbUser?.created_at,
        message: dbUser?.app_approved
          ? 'アプリケーションへのアクセスが承認されています'
          : 'アプリケーションへのアクセス承認待ちです。管理者にお問い合わせください。',
      },
    };
  }

  /**
   * ユーザープロファイル更新（承認済みユーザーのみ）
   */
  @ApiOperation({ 
    summary: 'ユーザープロファイル更新',
    description: '認証されたユーザーの基本情報を更新します。企業級入力検証・サニタイゼーション適用。'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'プロファイル更新成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: 'プロファイルが更新されました' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 403, description: '権限エラー（未承認ユーザー）' })
  @Put('profile')
  @UsePipes(EnhancedValidationPipe)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateData: UpdateUserProfileDto,
  ) {
    if (!user.approved) {
      this.logger.warn('Unauthorized profile update attempt', {
        auth0UserId: user.sub,
        email: user.email,
        approved: user.approved,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Unauthorized: User not approved for application access');
    }

    // 追加セキュリティログ
    this.logger.log('Profile update initiated', {
      auth0UserId: user.sub,
      email: user.email,
      updatedFields: Object.keys(updateData),
      organization: user.organization,
      timestamp: new Date().toISOString(),
    });

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.sub },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        include: {
          department: true,
          manager: true,
        },
      });

      // 更新成功ログ
      this.logger.log('Profile update successful', {
        auth0UserId: user.sub,
        updatedUserId: updatedUser.id,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: updatedUser,
        message: 'プロファイルが更新されました',
      };
    } catch (error) {
      // エラーログ
      this.logger.error('Profile update failed', {
        auth0UserId: user.sub,
        error: error.message,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * 購買権限確認（承認済みユーザーのみ）
   */
  @Get('purchase-permissions')
  async getPurchasePermissions(@CurrentUser() user: AuthenticatedUser) {
    if (!user.approved) {
      return {
        success: false,
        error: 'User not approved for application access',
        data: null,
      };
    }

    const permissions = user.permissions || [];
    const approvalLimit = Number(user.approvalLimit || 0);

    return {
      success: true,
      data: {
        canCreatePurchaseRequest: permissions.includes('purchase_request_create'),
        canApprovePurchaseRequest: permissions.includes('purchase_request_approve'),
        canViewAllPurchaseRequests: permissions.includes('purchase_request_view_all'),
        approvalLimit: approvalLimit,
        department: user.department,
        manager: user.manager,
        effectivePermissions: permissions,
      },
    };
  }
}
