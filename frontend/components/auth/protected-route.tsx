"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getStoredTokens, type User } from "@/lib/auth/auth-utils"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredPermission?: string
}

export default function ProtectedRoute({ children, requiredRole, requiredPermission }: ProtectedRouteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const tokens = getStoredTokens()

        if (!tokens || !tokens.accessToken) {
          router.push("/login")
          return
        }

        // トークンの有効性をチェック
        // 実際の実装では Auth0 SDK を使用してトークンを検証

        // ユーザー情報を取得
        const user: User = tokens.user

        // 必要な権限をチェック
        if (requiredRole && !user.groups?.includes(requiredRole)) {
          router.push("/unauthorized")
          return
        }

        if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
          router.push("/unauthorized")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole, requiredPermission])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
