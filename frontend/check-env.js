// 環境変数確認スクリプト
console.log('=== Auth0 環境変数確認 ===')
console.log('NEXT_PUBLIC_AUTH0_DOMAIN:', process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '❌ 未設定')
console.log('NEXT_PUBLIC_AUTH0_CLIENT_ID:', process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '❌ 未設定')
console.log('NEXT_PUBLIC_AUTH0_REDIRECT_URI:', process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || '❌ 未設定')
console.log('NEXT_PUBLIC_AUTH0_AUDIENCE:', process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '❌ 未設定')
console.log('NEXT_PUBLIC_AUTH0_SCOPE:', process.env.NEXT_PUBLIC_AUTH0_SCOPE || '❌ 未設定')
console.log('===========================')

// 不足している環境変数を特定
const missing = []
if (!process.env.NEXT_PUBLIC_AUTH0_DOMAIN) missing.push('NEXT_PUBLIC_AUTH0_DOMAIN')
if (!process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID) missing.push('NEXT_PUBLIC_AUTH0_CLIENT_ID')
if (!process.env.NEXT_PUBLIC_AUTH0_AUDIENCE) missing.push('NEXT_PUBLIC_AUTH0_AUDIENCE')

if (missing.length > 0) {
  console.log('❌ 不足している環境変数:')
  missing.forEach(env => console.log(`  - ${env}`))
  console.log('\n📝 .env.local ファイルに以下を追加してください:')
  console.log('NEXT_PUBLIC_AUTH0_DOMAIN=dev-22lwwfj3g02rol8a.jp.auth0.com')
  console.log('NEXT_PUBLIC_AUTH0_CLIENT_ID=y01U0CO0qzMTCKipxbdtrPh0DGopiOZQ')
  console.log('NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3000/callback')
  console.log('NEXT_PUBLIC_AUTH0_AUDIENCE=http://localhost:3001/api/v1')
  console.log('NEXT_PUBLIC_AUTH0_SCOPE=openid profile email')
} else {
  console.log('✅ すべての必須環境変数が設定されています')
}
