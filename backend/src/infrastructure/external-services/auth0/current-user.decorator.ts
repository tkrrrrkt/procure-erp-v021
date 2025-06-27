import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Auth0から認証されたユーザーの情報
 */
export interface AuthenticatedUser {
  // JWT標準クレーム
  sub: string;           // ユーザーID (Auth0)
  email?: string;        // メールアドレス
  name?: string;         // 表示名
  picture?: string;      // プロフィール画像URL
  
  // Auth0 Organizations カスタムクレーム
  org_id?: string;       // 組織ID (Auth0 Organizations)
  org_name?: string;     // 組織名
  tenant_id?: string;    // テナントID (DB)
  
  // ユーザー情報（DB同期後）
  user_id?: string;      // DB内ユーザーID
  permissions?: string[]; // 権限リスト
  roles?: string[];      // ロールリスト
  tenantId?: string;     // テナントID（レガシー互換）
  
  // ユーザー状態・承認情報
  approved?: boolean;    // 承認済みフラグ
  approvalLimit?: string; // 承認限度額
  
  // 組織構造
  department?: any;      // 部署情報
  manager?: any;         // 上司情報
  organization?: string; // 組織名（レガシー互換）
  
  // アクセス制御
  iat?: number;          // トークン発行時刻
  exp?: number;          // トークン有効期限
  aud?: string;          // Audience
  iss?: string;          // Issuer
  scope?: string;        // スコープ
}

/**
 * リクエストから認証済みユーザー情報を取得するデコレーター
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * 非認証エンドポイント用デコレーター
 */
export const Public = () => {
  // Reflectorを使用してメタデータを設定
  const { SetMetadata } = require('@nestjs/common');
  return SetMetadata('isPublic', true);
};
