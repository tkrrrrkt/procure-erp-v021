# フロントエンド環境変数設定

## .env.local ファイルを作成してください

フロントエンドのルートディレクトリに `.env.local` ファイルを作成し、以下の内容をコピー&ペーストしてください：

```env
# ==========================================
# ProcureERP Frontend Environment Variables
# ==========================================

# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=dev-22lwwfj3g02rol8a.jp.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=y01U0CO0qzMTCKipxbdtrPh0DGopiOZQ
NEXT_PUBLIC_AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_AUTH0_AUDIENCE=http://localhost:3001/api/v1
NEXT_PUBLIC_AUTH0_SCOPE=openid profile email org_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_ENV=development
```

## 設定完了後の確認

1. ファイルが正しく作成されているか確認
2. すべての値にタイポがないか確認  
3. ポート番号が正しいか確認（フロントエンド:3000, バックエンド:3001）

## セキュリティ注意事項

- `.env.local` ファイルは.gitignoreで除外されます
- 本番環境では必ず適切な値に変更してください
- Client Secretは絶対にフロントエンドに含めないでください
