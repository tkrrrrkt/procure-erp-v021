import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

// 許可された組織ID一覧（環境変数から取得、フォールバックで実際の組織ID）
const ALLOWED_ORGANIZATIONS = process.env.ALLOWED_ORGANIZATIONS?.split(',') || ['org_HHiSxAxNqdJoipla']

// CSP設定（環境変数から取得）
const CSP_ENABLED = process.env.CSP_ENABLED !== 'false' // デフォルト有効
const CSP_REPORT_ONLY = process.env.CSP_REPORT_ONLY === 'true'
const CSP_REPORT_URI = process.env.CSP_REPORT_URI || '/api/csp-report'
const CSP_ALLOWED_DOMAINS = process.env.CSP_ALLOWED_DOMAINS?.split(',') || []
const CSP_ENFORCE_HTTPS = process.env.CSP_ENFORCE_HTTPS !== 'false'

/**
 * 暗号学的に安全なnonceを生成
 */
function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')
}

/**
 * 企業級CSPポリシーを動的生成
 */
function generateCSPPolicy(nonce: string): string {
  const auth0Domain = process.env.AUTH0_DOMAIN?.replace('https://', '') || ''
  const allowedDomains = CSP_ALLOWED_DOMAINS.join(' ')
  
  // 基本CSPディレクティブを構築
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${auth0Domain} ${allowedDomains}`.trim(),
    `style-src 'self' 'nonce-${nonce}' ${auth0Domain} ${allowedDomains}`.trim(),
    `img-src 'self' data: ${auth0Domain} ${allowedDomains}`.trim(),
    `connect-src 'self' ${auth0Domain} ${allowedDomains}`.trim(),
    `frame-src ${auth0Domain}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'self'"
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
    
    // 組織パラメータがない場合
    if (!organizationParam) {
      const errorUrl = new URL('/error', request.url)
      errorUrl.searchParams.set('code', 'missing_organization')
      errorUrl.searchParams.set('message', 'Organization parameter is required')
      return NextResponse.redirect(errorUrl)
    }
    
    // 許可されていない組織の場合
    if (!ALLOWED_ORGANIZATIONS.includes(organizationParam)) {
      const errorUrl = new URL('/error', request.url)
      errorUrl.searchParams.set('code', 'invalid_organization')
      errorUrl.searchParams.set('message', 'Invalid organization')
      return NextResponse.redirect(errorUrl)
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
