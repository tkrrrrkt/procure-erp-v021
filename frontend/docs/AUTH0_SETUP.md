# Auth0 Multi-Tenant Setup Guide

## 概要
ProcureERPのマルチテナント認証を適切に動作させるため、Auth0テナントにPost-Login Actionを設定し、組織情報をIDトークンとアクセストークンに含める必要があります。

## 1. Auth0 Dashboard - Post-Login Action設定

### Action作成手順:
1. Auth0 Dashboard → **Actions** → **Flows** を開く
2. **Login** flowを選択
3. **+ Add Action** → **Build Custom** をクリック
4. 以下の設定でActionを作成:

**Action Name:** `Add Organization Claims`
**Trigger:** `post-login`

### Action Code:
```javascript
/**
 * ProcureERP Multi-Tenant Organization Claims Injection
 * 組織情報をIDトークンとアクセストークンに追加
 */
exports.onExecutePostLogin = async (event, api) => {
  console.log('Post-Login Action: Starting organization claims injection');
  
  // ユーザーのメタデータから組織情報を取得
  const userMetadata = event.user.user_metadata || {};
  const appMetadata = event.user.app_metadata || {};
  
  // 組織IDの取得（複数ソースから試行）
  let organizationId = null;
  
  // 1. app_metadataから組織ID取得
  if (appMetadata.organization_id) {
    organizationId = appMetadata.organization_id;
  }
  // 2. user_metadataから組織ID取得
  else if (userMetadata.organization_id) {
    organizationId = userMetadata.organization_id;
  }
  // 3. Auth0 Organizationsから取得
  else if (event.organization && event.organization.id) {
    organizationId = event.organization.id;
  }
  
  console.log('Organization ID found:', organizationId);
  
  if (organizationId) {
    // カスタムクレームをIDトークンに追加
    api.idToken.setCustomClaim('https://procure-erp.com/organization_id', organizationId);
    api.idToken.setCustomClaim('https://procure-erp.com/tenant_id', organizationId);
    
    // カスタムクレームをアクセストークンに追加
    api.accessToken.setCustomClaim('https://procure-erp.com/organization_id', organizationId);
    api.accessToken.setCustomClaim('https://procure-erp.com/tenant_id', organizationId);
    
    console.log('Organization claims added to tokens');
  } else {
    console.warn('No organization ID found for user:', event.user.user_id);
    // デフォルト組織を設定（必要に応じて）
    // api.idToken.setCustomClaim('https://procure-erp.com/organization_id', 'default_org');
  }
  
  // 追加のユーザー情報をクレームに追加
  if (event.user.email) {
    api.idToken.setCustomClaim('https://procure-erp.com/email', event.user.email);
  }
  
  if (event.user.name) {
    api.idToken.setCustomClaim('https://procure-erp.com/name', event.user.name);
  }
  
  console.log('Post-Login Action: Completed successfully');
};
```

### 2. Action適用手順:
1. Actionを保存
2. **Deploy** をクリック
3. **Login** flowに戻る
4. 作成したActionをDrag & Dropで **Login** flowに追加
5. **Apply** をクリック

## 2. Auth0 Organizations設定

### Organizations作成:
1. Auth0 Dashboard → **Organizations** を開く
2. **+ Create Organization** をクリック
3. 各テナント/組織に対して以下を設定:
   - **Name**: 組織名（例: "Acme Corp"）
   - **Display Name**: 表示名
   - **Organization ID**: 一意のID（例: "org_acme_corp"）

### User Assignment:
1. 各Organizationに対して、所属するユーザーを割り当て
2. **Members** タブでユーザーを追加

## 3. フロントエンド設定更新

上記のAuth0設定完了後、フロントエンドコードを以下のように更新します:

### 3.1 ログインページ簡素化:
```typescript
// app/login/page.tsx - 簡素化版
const handleLogin = () => {
  loginWithRedirect({
    authorizationParams: {
      organization: currentOrganization, // Organizationパラメータのみ使用
      redirect_uri: `${window.location.origin}/callback`
    }
  });
};
```

### 3.2 コールバック処理簡素化:
```typescript
// app/callback/page.tsx - 簡素化版
useEffect(() => {
  const handleCallback = async () => {
    try {
      // Auth0からユーザー情報を取得
      const user = await getUser();
      
      if (user) {
        // カスタムクレームから組織ID取得
        const organizationId = user['https://procure-erp.com/organization_id'];
        
        if (organizationId) {
          // 組織コンテキストを設定
          setCurrentOrganization(organizationId);
          // ダッシュボードにリダイレクト
          router.push('/dashboard');
        } else {
          throw new Error('組織情報が見つかりません');
        }
      }
    } catch (error) {
      console.error('Callback error:', error);
      setError('認証中にエラーが発生しました');
    }
  };

  handleCallback();
}, [getUser, router, setCurrentOrganization]);
```

## 4. 検証手順

### 4.1 Token検証:
1. Auth0のログを確認（Dashboard → Monitoring → Logs）
2. IDトークンをjwt.ioでデコードし、カスタムクレームが含まれていることを確認
3. フロントエンドコンソールでuser objectを確認

### 4.2 フロー検証:
1. 組織パラメータ付きでログインページにアクセス
2. Auth0でログイン
3. コールバックで組織情報が適切に取得されることを確認
4. ダッシュボードに正常にリダイレクトされることを確認

## 5. トラブルシューティング

### よくある問題:
1. **カスタムクレームが空**: Post-Login Actionが適切にデプロイされているか確認
2. **組織情報なし**: ユーザーがOrganizationに割り当てられているか確認
3. **権限エラー**: Action実行権限が適切に設定されているか確認

### ログ確認:
- Auth0 Dashboard → Monitoring → Logs
- Post-Login Actionの実行ログを確認
- エラーがあれば詳細を確認

## 6. セキュリティ考慮事項

- カスタムクレームのnamespaceは必ずHTTPS URLを使用
- 機密情報をクレームに含めない
- 組織情報の検証は必ずバックエンドで実行
- トークンの有効期限を適切に設定

この設定により、カスタムstateパラメータに依存しない、より安全で信頼性の高いマルチテナント認証が実現できます。
