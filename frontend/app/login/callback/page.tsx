"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState("認証処理中...")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus("認証情報を確認中...")

        // Auth0コールバック処理
        // 実際の実装では @auth0/auth0-react を使用
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")

        if (!code) {
          throw new Error("認証コードが見つかりません")
        }

        setStatus("ユーザー情報を取得中...")

        // デモ用の遅延
        await new Promise((resolve) => setTimeout(resolve, 2000))

        setStatus("ダッシュボードにリダイレクト中...")

        // 成功時はダッシュボードにリダイレクト
        router.push("/dashboard")
      } catch (error) {
        console.error("Callback error:", error)
        setStatus("認証に失敗しました。再度ログインしてください。")

        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-semibold text-gray-900">認証処理中</h2>
          <p className="text-center text-gray-600">{status}</p>
        </CardContent>
      </Card>
    </div>
  )
}
