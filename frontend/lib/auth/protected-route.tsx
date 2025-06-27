'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './auth0-provider'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 認証されていない場合はログインページにリダイレクト
      loginWithRedirect({
        appState: { returnTo: pathname }
      })
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, pathname])

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  // 認証されていない場合は何も表示しない（リダイレクト処理中）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">ログインページへリダイレクト中...</p>
        </div>
      </div>
    )
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>
}

// 権限チェック付きのProtectedRoute
interface ProtectedRouteWithPermissionsProps extends ProtectedRouteProps {
  requiredPermissions?: string[]
}

export function ProtectedRouteWithPermissions({ 
  children, 
  requiredPermissions = [] 
}: ProtectedRouteWithPermissionsProps) {
  const { user } = useAuth()
  const router = useRouter()

  // 基本的な認証チェックを実行
  const baseProtection = <ProtectedRoute>{children}</ProtectedRoute>

  // 権限チェックが不要な場合
  if (requiredPermissions.length === 0) {
    return baseProtection
  }

  // ユーザーの権限を取得
  const userPermissions = user?.permissions || user?.['https://procure-erp.com/permissions'] || []

  // 必要な権限がすべて含まれているかチェック
  const hasAllPermissions = requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  )

  if (!hasAllPermissions) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h2>
            <p className="text-gray-600 mb-6">
              このページにアクセスするには適切な権限が必要です。
              管理者にお問い合わせください。
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return baseProtection
}
