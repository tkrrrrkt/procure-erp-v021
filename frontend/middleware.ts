import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 許可された組織ID一覧（環境変数から取得、フォールバックで実際の組織ID）
const ALLOWED_ORGANIZATIONS = process.env.ALLOWED_ORGANIZATIONS?.split(',') || ['org_HHiSxAxNqdJoipla']

// CSP設定（環境変数から取得）
const CSP_ENABLED = process.env.CSP_ENABLED !== 'false' // デフォルト有効
const CSP_REPORT_ONLY = process.env.CSP_REPORT_ONLY === 'true'
const CSP_REPORT_URI = process.env.CSP_REPORT_URI || '/api/csp-report'
const CSP_ALLOWED_DOMAINS = process.env.CSP_ALLOWED_DOMAINS?.split(',') || []
const CSP_ENFORCE_HTTPS = process.env.CSP_ENFORCE_HTTPS !== 'false'

/**
 * 暗号学的に安全なnonceを生成 (Edge Runtime対応)
 */
function generateNonce(): string {
  // Edge RuntimeではWeb Crypto APIを使用
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

/**
 * 企業級CSPポリシーを動的生成 (開発環境対応)
 */
function generateCSPPolicy(nonce: string): string {
  // Auth0ドメインを複数の形式で追加
  const auth0Domain = process.env.AUTH0_DOMAIN?.replace('https://', '') || 'dev-22lwwfj3g02rol8a.jp.auth0.com'
  const auth0FullUrl = process.env.AUTH0_DOMAIN || 'https://dev-22lwwfj3g02rol8a.jp.auth0.com'
  const allowedDomains = CSP_ALLOWED_DOMAINS.join(' ')
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // 開発環境と本番環境でのCSPディレクティブ
  const directives = [
    "default-src 'self'",
    // script-src: 開発環境ではゆるい設定、本番環境では厳格制御
    isDevelopment 
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${auth0Domain} ${allowedDomains} localhost:3000`.trim()
      : `script-src 'self' 'nonce-${nonce}' ${auth0Domain} ${allowedDomains}`.trim(),
    // style-src: 開発環境ではゆるい設定、本番環境ではnonce-based制御
    isDevelopment
      ? `style-src 'self' 'unsafe-inline' ${auth0Domain} ${allowedDomains}`.trim()
      : `style-src 'self' 'nonce-${nonce}' ${auth0Domain} ${allowedDomains}`.trim(),
    // img-src: 基本ソース＋Auth0
    `img-src 'self' data: ${auth0Domain} ${allowedDomains}`.trim(),
    // connect-src: WebSocket（開発時）＋Auth0
    `connect-src 'self' ${isDevelopment ? 'ws://localhost:3001 wss://localhost:3001 ws://localhost:3000 wss://localhost:3000 ' : ''}${auth0Domain} ${auth0FullUrl} ${allowedDomains}`.trim(),
    // frame-src: Auth0認証フレーム許可
    `frame-src 'self' ${auth0Domain}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "media-src 'self'",
    // worker-src: 開発時のみblob許可
    `worker-src 'self'${isDevelopment ? ' blob:' : ''}`
  ]

  // HTTPS強制設定
  if (CSP_ENFORCE_HTTPS) {
    directives.push("upgrade-insecure-requests")
  }

  // CSP違反報告設定
  if (CSP_REPORT_URI) {
    directives.push(`report-uri ${CSP_REPORT_URI}`)
    directives.push(`report-to default`)
  }

  return directives.join('; ')
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ログインページへのアクセスをチェック
  if (pathname === '/login') {
    const organizationParam = searchParams.get('organization')
    
    // 組織パラメータがない場合は警告ログのみ、リダイレクトしない
    if (!organizationParam) {
      console.warn('Login access without organization parameter')
      // リダイレクトせずに続行（フロントエンドで処理）
    } else if (!ALLOWED_ORGANIZATIONS.includes(organizationParam)) {
      // 許可されていない組織の場合も警告ログのみ
      console.warn(`Login access with invalid organization: ${organizationParam}`)
      // リダイレクトせずに続行（フロントエンドで処理）
    }
  }

  // レスポンス準備
  const response = NextResponse.next()
  
  // 暗号学的に安全なnonce生成
  const nonce = generateNonce()
  
  // CSP設定が有効な場合のみ適用
  if (CSP_ENABLED) {
    const cspPolicy = generateCSPPolicy(nonce)
    const cspHeaderName = CSP_REPORT_ONLY ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
    response.headers.set(cspHeaderName, cspPolicy)
  }

  // 追加セキュリティヘッダー
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  
  // Permissions Policy (Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  )

  // HSTS (HTTPS Strict Transport Security)
  if (CSP_ENFORCE_HTTPS) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // CSP違反報告用のReport-To設定
  if (CSP_REPORT_URI) {
    response.headers.set(
      'Report-To',
      JSON.stringify({
        group: 'default',
        max_age: 31536000,
        endpoints: [{ url: CSP_REPORT_URI }],
        include_subdomains: true
      })
    )
  }

  // nonceをリクエストヘッダーに追加（SSRで使用可能に）
  response.headers.set('X-CSP-Nonce', nonce)

  return response
}

export const config = {
  matcher: [
    '/login',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
