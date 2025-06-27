import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthenticatedUser } from '../../infrastructure/external-services/auth0/current-user.decorator';
import { User, Tenant } from '@prisma/client';

type UserWithTenant = User & { tenant: Tenant };

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auth0ユーザー情報をDBのUserマスタと同期
   * @param auth0User Auth0から取得したユーザー情報
   * @returns DB上の完全なUser情報
   */
  async syncUser(auth0User: AuthenticatedUser): Promise<UserWithTenant> {
    try {
      const auth0UserId = auth0User.sub;
      
      // Auth0からの組織情報を取得
      const organizationInfo = {
        org_id: auth0User.org_id,
        org_name: auth0User.org_name,
        tenant_id: auth0User.tenant_id || auth0User.org_id,
      };

      this.logger.log(`Syncing user: ${auth0UserId} for organization: ${organizationInfo.org_id}`);

      // 既存ユーザーを検索
      let user = await this.prisma.user.findUnique({
        where: { auth0_user_id: auth0UserId },
        include: {
          tenant: true,
        },
      });

      if (user) {
        // 既存ユーザーの更新（組織情報含む）
        user = await this.updateExistingUser(user, auth0User, organizationInfo);
      } else {
        // 新規ユーザーの作成（組織情報含む）
        user = await this.createNewUser(auth0User, organizationInfo);
      }

      this.logger.log(`User sync completed for: ${auth0UserId}, tenant: ${user.tenant_id}`);
      return user;
    } catch (error) {
      this.logger.error(`User sync failed for ${auth0User.sub}:`, error);
      throw error;
    }
  }

  /**
   * 新規ユーザーをDBに作成
   */
  private async createNewUser(auth0User: AuthenticatedUser, organizationInfo: any): Promise<UserWithTenant> {
    const [firstName, lastName] = this.parseUserName(auth0User);
    
    // テナント情報の取得または作成
    let tenantId = organizationInfo.tenant_id;
    if (organizationInfo.org_id && !tenantId) {
      // 組織IDが存在する場合、テナントを検索または作成
      const tenant = await this.findOrCreateTenant(organizationInfo);
      tenantId = tenant.id;
    }

    const userData = {
      auth0_user_id: auth0User.sub,
      email: auth0User.email || '',
      first_name: firstName,
      last_name: lastName,
      tenant_id: tenantId,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    };

    return this.prisma.user.create({
      data: userData,
      include: {
        tenant: true,
      },
    });
  }

  /**
   * 既存ユーザーの更新
   */
  private async updateExistingUser(
    existingUser: UserWithTenant, 
    auth0User: AuthenticatedUser, 
    organizationInfo: any
  ): Promise<UserWithTenant> {
    const [firstName, lastName] = this.parseUserName(auth0User);
    
    // 組織情報が変更された場合の処理
    let tenantId = existingUser.tenant_id;
    if (organizationInfo.org_id && organizationInfo.tenant_id !== existingUser.tenant_id) {
      const tenant = await this.findOrCreateTenant(organizationInfo);
      tenantId = tenant.id;
      this.logger.log(`User tenant changed from ${existingUser.tenant_id} to ${tenantId}`);
    }

    const updateData = {
      email: auth0User.email || existingUser.email,
      first_name: firstName,
      last_name: lastName,
      tenant_id: tenantId,
      updated_at: new Date(),
    };

    return this.prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
      include: {
        tenant: true,
      },
    });
  }

  /**
   * ユーザーの名前を解析
   */
  private parseUserName(auth0User: AuthenticatedUser): [string, string] {
    // Auth0のnameフィールドがある場合は優先
    if (auth0User.name) {
      const parts = auth0User.name.split(' ');
      if (parts.length >= 2) {
        return [parts[0], parts.slice(1).join(' ')];
      }
      return [parts[0], ''];
    }

    // メールアドレスから推測
    if (!auth0User.email) {
      return ['User', ''];
    }

    const localPart = auth0User.email.split('@')[0];
    
    // 一般的な命名パターンを想定
    if (localPart.includes('.')) {
      const parts = localPart.split('.');
      return [parts[0], parts.slice(1).join(' ')];
    }
    
    return [localPart, ''];
  }

  /**
   * テナント情報を取得または作成
   */
  private async findOrCreateTenant(organizationInfo: any): Promise<Tenant> {
    const tenantName = organizationInfo.org_name || `Organization ${organizationInfo.org_id}`;
    
    // 既存テナント検索（名前で検索）
    let tenant = await this.prisma.tenant.findFirst({
      where: {
        name: tenantName,
      },
    });

    if (!tenant) {
      // 新規テナント作成
      tenant = await this.prisma.tenant.create({
        data: {
          name: tenantName,
          status: 'ACTIVE',
          code: organizationInfo.org_id || `ORG_${Date.now()}`,
          plan: 'BASIC',
          settings: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      
      this.logger.log(`Created new tenant: ${tenant.name} (${tenant.id})`);
    }

    return tenant;
  }

  /**
   * ユーザーの権限リストをフラット化
   */
  getUserPermissions(user: any): string[] {
    if (!user.roles) return [];
    
    const permissions = new Set<string>();
    
    user.roles.forEach((userRole: any) => {
      if (userRole.role && userRole.role.permissions) {
        userRole.role.permissions.forEach((rolePermission: any) => {
          if (rolePermission.permission) {
            permissions.add(rolePermission.permission.name);
          }
        });
      }
    });
    
    return Array.from(permissions);
  }
}
