import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 許可された組織ID一覧（環境変数から取得、フォールバックで実際の組織ID）
const ALLOWED_ORGANIZATIONS = process.env.ALLOWED_ORGANIZATIONS?.split(',') || ['org_HHiSxAxNqdJoipla']

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ログインページへのアクセスをチェック
  if (pathname === '/login') {
    const organizationParam = searchParams.get('organization')
    
    // 組織パラメータがない場合
    if (!organizationParam) {
      // エラーページにリダイレクト
      const errorUrl = new URL('/error', request.url)
      errorUrl.searchParams.set('code', 'missing_organization')
      errorUrl.searchParams.set('message', 'Organization parameter is required')
      return NextResponse.redirect(errorUrl)
    }
    
    // 許可されていない組織の場合
    if (!ALLOWED_ORGANIZATIONS.includes(organizationParam)) {
      // エラーページにリダイレクト
      const errorUrl = new URL('/error', request.url)
      errorUrl.searchParams.set('code', 'invalid_organization')
      errorUrl.searchParams.set('message', 'Invalid organization')
      return NextResponse.redirect(errorUrl)
    }
  }

  // その他のセキュリティヘッダーを追加
  const response = NextResponse.next()
  
  // セキュリティヘッダー設定
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.auth0.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.auth0.com; connect-src 'self' *.auth0.com; frame-src *.auth0.com;"
  )

  return response
}

export const config = {
  matcher: [
    '/login',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
