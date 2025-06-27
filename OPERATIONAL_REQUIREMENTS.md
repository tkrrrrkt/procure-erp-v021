# 運用要件: ユーザー管理システム

## 必須実装機能

### 1. 管理者用ユーザー管理画面
- **パス**: `/admin/users`
- **権限**: システム管理者のみ
- **機能**:
  - ユーザー一覧表示
  - 新規ユーザー招待
  - ユーザー権限管理
  - 組織メンバー管理

### 2. Auth0 Management API統合
- **目的**: ユーザー CRUD 操作の自動化
- **実装場所**: `backend/src/modules/user-management/`
- **必要権限**: 
  - `read:users`
  - `create:users`
  - `update:users`
  - `read:organizations`
  - `update:organization_members`

### 3. 招待・通知システム
- **初期パスワード**: 自動生成 + メール送信
- **パスワードリセット**: Auth0標準機能利用
- **ユーザー招待フロー**: 
  1. 管理者が招待
  2. Auth0でユーザー作成
  3. 組織に自動追加
  4. 招待メール送信

## 運用フロー例

### 新入社員の追加
```bash
1. 管理者: 管理画面で社員情報入力
2. システム: Auth0でユーザー自動作成
3. システム: 組織メンバーに自動追加
4. システム: 初期パスワードをメール送信
5. 社員: 初回ログイン時にパスワード変更
```

### 退職者の処理
```bash
1. 管理者: 管理画面でユーザー無効化
2. システム: Auth0でユーザー無効化
3. システム: 組織メンバーから除外
4. システム: セッション無効化
```

## セキュリティ要件

### 初期パスワード
- **強度**: 英数字記号12文字以上
- **有効期限**: 7日間（初回ログイン必須）
- **配送方法**: セキュアメール（暗号化推奨）

### 管理者権限
- **2FA必須**: 管理者アカウントは多要素認証必須
- **監査ログ**: 全ユーザー管理操作をログ記録
- **権限分離**: 一般ユーザーは管理機能にアクセス不可

## 技術実装

### フロントエンド
```typescript
// pages/admin/users/index.tsx
- ユーザー一覧テーブル
- 招待モーダル
- 権限編集フォーム
```

### バックエンド
```typescript
// src/modules/user-management/
- user-management.controller.ts
- user-management.service.ts
- auth0-management.service.ts
- dto/create-user.dto.ts
```

### Auth0設定
```bash
# Management API Application
- Type: Machine to Machine
- Authorized APIs: Auth0 Management API
- Scopes: users:*, organizations:*
```

## 初期セットアップ手順

### 1. Auth0 Management API設定
1. Auth0ダッシュボード → Applications → Create Application
2. Type: Machine to Machine
3. Authorize: Auth0 Management API
4. Scopes: 必要権限を選択

### 2. 環境変数設定
```bash
# backend/.env
AUTH0_MANAGEMENT_CLIENT_ID=your_management_client_id
AUTH0_MANAGEMENT_CLIENT_SECRET=your_management_client_secret
AUTH0_MANAGEMENT_DOMAIN=dev-xxxx.jp.auth0.com
```

### 3. 初期管理者作成
```bash
# Auth0ダッシュボードで手動作成
Email: admin@company.com
Role: system_admin
Organization: org_HHiSxAxNqdJoipla
```

## 運用開始チェックリスト

- [ ] Auth0 Management API設定完了
- [ ] 管理者画面実装完了
- [ ] 招待メール機能実装完了
- [ ] 初期管理者アカウント作成
- [ ] ユーザー管理手順書作成
- [ ] セキュリティポリシー策定
- [ ] 運用テスト実施

## 月次運用タスク

- [ ] 非アクティブユーザーの確認
- [ ] 権限レビュー
- [ ] 監査ログ確認
- [ ] パスワードポリシー遵守確認
