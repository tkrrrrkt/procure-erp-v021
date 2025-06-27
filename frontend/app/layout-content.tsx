'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth0-provider'
import { ProtectedRoute } from '@/lib/auth/protected-route'
import { initializeApiClient } from '@/lib/auth/api-client'
import Header from '@/components/header'
import Sidebar from '@/components/sidebar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { getAccessToken } = useAuth()

  // APIクライアントを初期化
  useEffect(() => {
    initializeApiClient(getAccessToken)
  }, [getAccessToken])

  // ログイン画面とコールバックページかどうかをチェック
  const isPublicPage = pathname.startsWith('/login') || pathname.startsWith('/callback')

  if (isPublicPage) {
    // ログイン画面とコールバックページの場合はサイドバーとヘッダーを表示しない
    return <main className="min-h-screen">{children}</main>
  }

  // 通常の画面の場合は認証が必要
  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
