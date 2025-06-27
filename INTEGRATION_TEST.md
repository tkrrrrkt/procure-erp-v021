# 🧪 **Integration Test Guide**

## **Test Scenarios**

### **1. 正常ログインフロー (sint組織)**
```bash
# URL: http://localhost:3000/login?organization=sint
✅ Expected: ログインページ表示
✅ Expected: "sint 組織でサインイン"ボタン表示
✅ Expected: Auth0リダイレクト成功
✅ Expected: 組織メンバーのみ認証成功
```

### **2. セキュリティテスト**
```bash
# 組織パラメータなし
# URL: http://localhost:3000/login
❌ Expected: エラーページリダイレクト
❌ Expected: "組織パラメータが必要です"メッセージ

# 無効な組織
# URL: http://localhost:3000/login?organization=invalid
❌ Expected: エラーページリダイレクト  
❌ Expected: "無効な組織です"メッセージ
```

### **3. API認証テスト**
```bash
# JWTトークンにorg_idクレーム含有確認
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/v1/protected-endpoint

✅ Expected: org_id, tenant_id, org_name claims
✅ Expected: Backend認証成功
```

## **Manual Testing Steps**

### **Step 1: Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### **Step 2: Backend Setup**
```bash
cd backend
npm install
npm run start:dev
```

### **Step 3: Test Execution**
1. **Valid Access**: `http://localhost:3000/login?organization=sint`
2. **Invalid Access**: `http://localhost:3000/login`
3. **Unauthorized Org**: `http://localhost:3000/login?organization=fake`

### **Step 4: Auth0 Configuration**
1. Create Auth0 Organization named `sint`
2. Add test users to `sint` organization
3. Deploy Post-Login Action from `/auth0-actions/post-login-action.js`
4. Enable organization login restrictions

## **Expected JWT Token Structure**

```json
{
  "sub": "auth0|user123",
  "email": "user@sint.com",
  "https://api.procure-erp.com/org_id": "org_sint",
  "https://api.procure-erp.com/org_name": "SINT Corporation",
  "https://api.procure-erp.com/tenant_id": "org_sint",
  "https://api.procure-erp.com/roles": ["user"],
  "scope": "openid profile email org_id"
}
```

## **Troubleshooting**

### **Common Issues**
1. **401 Unauthorized**: Check JWT token and organization membership
2. **Redirect Loop**: Verify environment variables
3. **Organization Error**: Confirm Auth0 organization setup
4. **CORS Issues**: Check backend CORS configuration

### **Debug Commands**
```bash
# Check environment variables
node frontend/check-env.js

# View JWT token contents  
echo "YOUR_JWT_TOKEN" | cut -d'.' -f2 | base64 -d | jq

# Test backend endpoint
curl -v http://localhost:3001/api/v1/health
```
