import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { Auth0AuthGuard } from '../../../infrastructure/external-services/auth0/auth0-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../../infrastructure/external-services/auth0/current-user.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

interface UpdateUserProfileDto {
  employee_code?: string;
  department_id?: string;
  manager_id?: string;
  approval_limit?: number;
}

@Controller('system/user')
@UseGuards(Auth0AuthGuard)
export class UserProfileController {
  constructor(private readonly prisma: PrismaService) {}

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
        }
      }
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
      }
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
          : 'アプリケーションへのアクセス承認待ちです。管理者にお問い合わせください。'
      }
    };
  }

  /**
   * ユーザープロファイル更新（承認済みユーザーのみ）
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateData: UpdateUserProfileDto
  ) {
    if (!user.approved) {
      throw new Error('Unauthorized: User not approved for application access');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.sub },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      include: {
        department: true,
        manager: true,
      }
    });

    return {
      success: true,
      data: updatedUser,
      message: 'プロファイルが更新されました'
    };
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
        data: null
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
        effectivePermissions: permissions
      }
    };
  }
}
