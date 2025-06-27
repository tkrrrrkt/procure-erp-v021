# Auth0 Customer Identity Cloud セットアップガイド

## 概要
このドキュメントは、ProcureERP（エンタープライズ購買管理システム）でAuth0 Customer Identity Cloud (CIC)を設定するための手順書です。

## 前提条件
- Node.js 18以上
- Auth0開発者アカウント（無料）

## 1. Auth0アカウントの作成

1. [Auth0のサイト](https://auth0.com/signup)にアクセス
2. 「Sign up」をクリック
3. **重要**: 「Customer Identity Cloud」を選択（Workforce Identity Cloudではない）
4. アカウント情報を入力して作成

## 2. Auth0テナントの設定

### 2.1 新規テナントの作成
1. Auth0ダッシュボードにログイン
2. テナント名を設定（例: `procure-erp-dev`）
3. リージョンを選択（日本の場合は`JP`を推奨）

### 2.2 アプリケーションの作成

#### フロントエンド用（SPA）
1. 左メニューから「Applications」→「Create Application」
2. 名前: `ProcureERP Frontend`
3. タイプ: `Single Page Application`を選択
4. 「Create」をクリック

#### バックエンド用（API）
1. 左メニューから「Applications」→「APIs」→「Create API」
2. 名前: `ProcureERP Backend API`
3. Identifier: `https://api.procure-erp.com/v1`
4. Signing Algorithm: `RS256`を選択

### 2.3 フロントエンドアプリケーションの設定

「Settings」タブで以下を設定：

```
Allowed Callback URLs:
http://localhost:3000/callback,
http://localhost:3000/,
https://your-production-domain.com/callback

Allowed Logout URLs:
http://localhost:3000/,
https://your-production-domain.com/

Allowed Web Origins:
http://localhost:3000,
https://your-production-domain.com

Allowed Origins (CORS):
http://localhost:3000,
https://your-production-domain.com
```

### 2.4 カスタムドメインの設定（オプション）

1. 「Settings」→「Custom Domains」
2. ドメインを追加（例: `auth.procure-erp.com`）
3. DNS設定を行い、検証を完了

## 3. Organizations（マルチテナント）の設定

### 3.1 Organizations機能の有効化
1. 左メニューから「Organizations」
2. 「Enable Organizations」をクリック

### 3.2 組織の作成（テスト用）
```javascript
// Management APIを使用した組織作成例
POST /api/v2/organizations
{
  "name": "acme-corp",
  "display_name": "Acme Corporation",
  "branding": {
    "logo_url": "https://example.com/acme-logo.png",
    "colors": {
      "primary": "#6366f1",
      "page_background": "#ffffff"
    }
  }
}
```

## 4. 環境変数の設定

### 4.1 フロントエンド（.env.local）
```env
# Auth0設定
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-spa-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3001/callback
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.procure-erp.com/v1
NEXT_PUBLIC_AUTH0_SCOPE=openid profile email org_id

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4.2 バックエンド（.env）
```env
# Okta/Auth0設定
OKTA_ISSUER=https://your-tenant.auth0.com/
OKTA_CLIENT_ID=your-spa-client-id
OKTA_AUDIENCE=https://api.procure-erp.com
```

## 5. カスタムクレームの設定

### 5.1 Actionsの作成
1. 「Actions」→「Flows」→「Login」
2. 「Create Action」→「Build Custom」
3. 名前: `Add Tenant Claims`

```javascript
/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  // 組織IDをトークンに追加
  if (event.organization) {
    api.idToken.setCustomClaim('org_id', event.organization.id);
    api.idToken.setCustomClaim('org_name', event.organization.name);
    api.accessToken.setCustomClaim('org_id', event.organization.id);
    api.accessToken.setCustomClaim('tenant_id', event.organization.id);
  }
  
  // ユーザーのロールを追加
  if (event.authorization) {
    api.idToken.setCustomClaim('permissions', event.authorization.permissions);
    api.accessToken.setCustomClaim('permissions', event.authorization.permissions);
  }
};
```

4. 「Deploy」をクリック
5. フローにドラッグ&ドロップして適用

## 6. RBAC（ロールベースアクセス制御）の設定

### 6.1 ロールの作成
1. 「User Management」→「Roles」
2. 以下のロールを作成：
   - `procurement-admin`: 購買管理者
   - `procurement-user`: 購買担当者
   - `approver`: 承認者
   - `viewer`: 閲覧者

### 6.2 権限の定義
各ロールに以下の権限（Permissions）を設定：

```
procurement-admin:
  - create:purchase-request
  - read:purchase-request
  - update:purchase-request
  - delete:purchase-request
  - approve:purchase-request
  - create:purchase-order
  - manage:vendors
  - manage:settings

procurement-user:
  - create:purchase-request
  - read:purchase-request
  - update:purchase-request:own
  - read:vendors

approver:
  - read:purchase-request
  - approve:purchase-request

viewer:
  - read:purchase-request
  - read:purchase-order
  - read:vendors
```

## 7. エンタープライズ接続（SSO）の設定

### 7.1 SAML接続の追加（例）
1. 「Authentication」→「Enterprise」→「SAML」
2. 「Create Connection」
3. 設定内容：
   - Connection Name: `acme-corp-saml`
   - Sign In URL: `顧客のIdP URL`
   - X509 Signing Certificate: `顧客から提供される証明書`

### 7.2 組織への接続の紐付け
```javascript
// Management APIを使用
POST /api/v2/organizations/{org_id}/enabled_connections
{
  "connection_id": "con_xxx",
  "assign_membership_on_login": true
}
```

## 8. セキュリティ設定

### 8.1 Attack Protection
1. 「Security」→「Attack Protection」
2. 以下を有効化：
   - Bot Detection
   - Suspicious IP Throttling
   - Brute Force Protection
   - Breached Password Detection

### 8.2 MFA設定
1. 「Security」→「Multi-factor Authentication」
2. 以下の要素を有効化：
   - One-time Password (OTP)
   - WebAuthn with FIDO Security Keys
   - Push Notifications via Auth0 Guardian

## 9. 開発用ユーザーの作成

### 9.1 テストユーザーの作成
1. 「User Management」→「Users」→「Create User」
2. 以下のユーザーを作成：
   - Email: `admin@acme.com`
   - Password: `Test1234!`
   - Connection: `Username-Password-Authentication`

### 9.2 組織への追加
1. ユーザーの詳細ページ→「Organizations」タブ
2. 「Add to Organization」で`acme-corp`を選択
3. ロール`procurement-admin`を割り当て

## 10. トラブルシューティング

### よくある問題

#### CORS エラー
- Allowed Web OriginsにフロントエンドのURLが含まれているか確認
- プロトコル（http/https）が正確に一致しているか確認

#### Invalid audience エラー
- APIのIdentifierとフロントエンドのaudienceが一致しているか確認
- バックエンドの`OKTA_AUDIENCE`が正しく設定されているか確認

#### Organization not found エラー
- ユーザーが組織に所属しているか確認
- ログイン時に組織IDが指定されているか確認

## 11. 本番環境への移行チェックリスト

- [ ] カスタムドメインの設定
- [ ] 本番環境のURLをAllowed URLsに追加
- [ ] Rate Limitsの設定確認
- [ ] バックアップとリカバリープランの策定
- [ ] 監査ログの設定
- [ ] SLAの確認（99.99%が必要な場合はEnterpriseプラン）

## 参考リンク

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 React SDK](https://auth0.com/docs/libraries/auth0-react)
- [Auth0 Management API](https://auth0.com/docs/api/management/v2)
- [Auth0 Organizations](https://auth0.com/docs/manage-users/organizations)
