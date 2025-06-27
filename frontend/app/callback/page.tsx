'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth0 } from '@auth0/auth0-react'
import { Loader2 } from 'lucide-react'

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading, error, handleRedirectCallback } = useAuth0()
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (message: string) => {
    console.log(`[Callback Debug] ${message}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addDebugInfo('Callback page mounted')
    addDebugInfo(`isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}, hasError: ${!!error}`)
    
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const state = searchParams.get('state')
    
    addDebugInfo(`URL params - code: ${code ? 'present' : 'missing'}, error: ${errorParam || 'none'}, state: ${state ? 'present' : 'missing'}`)

    // 10秒後にタイムアウト処理
    const timeout = setTimeout(() => {
      addDebugInfo('Timeout reached - redirecting to dashboard')
      setTimeoutReached(true)
    }, 10000)

    const processCallback = async () => {
      try {
        addDebugInfo('Starting manual callback processing')
        
        if (errorParam) {
          addDebugInfo(`Auth0 callback error: ${errorParam}`)
          router.push(`/login?error=${encodeURIComponent(errorParam)}`)
          return
        }

        if (code) {
          addDebugInfo('Authorization code found, processing callback')
          
          // URL全体をログ出力
          const currentUrl = window.location.href
          addDebugInfo(`Current URL: ${currentUrl}`)
          
          // handleRedirectCallbackを呼び出し
          const result = await handleRedirectCallback()
          addDebugInfo(`Callback result: ${JSON.stringify(result)}`)
          
          // 結果を待機
          addDebugInfo('Callback processing completed successfully')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        const errorStack = err instanceof Error ? err.stack : 'No stack trace available'
        
        addDebugInfo(`Callback processing failed: ${errorMessage}`)
        console.error('Detailed callback error:', err)
        console.error('Error stack:', errorStack)
        
        // より詳細なエラー情報をURLに含める
        const encodedError = encodeURIComponent(`エラー詳細: ${errorMessage}`)
        router.push(`/login?error=${encodedError}`)
      }
    }

    if (!isLoading) {
      if (error) {
        addDebugInfo(`Auth0 hook error: ${error.message}`)
        clearTimeout(timeout)
        router.push(`/login?error=${encodeURIComponent(error.message)}`)
      } else if (isAuthenticated) {
        addDebugInfo('User is authenticated, redirecting')
        clearTimeout(timeout)
        const returnTo = sessionStorage.getItem('auth_return_to') || '/dashboard'
        sessionStorage.removeItem('auth_return_to')
        addDebugInfo(`Redirecting to: ${returnTo}`)
        router.push(returnTo)
      } else if (searchParams.get('code')) {
        addDebugInfo('Code parameter found, starting callback processing')
        processCallback()
      } else {
        addDebugInfo('No code parameter found, waiting for authentication state')
      }
    } else {
      addDebugInfo('Auth0 is still loading...')
    }

    return () => {
      clearTimeout(timeout)
      addDebugInfo('Cleanup: timeout cleared')
    }
  }, [isAuthenticated, isLoading, error, router, searchParams, handleRedirectCallback])

  // タイムアウト時の処理
  useEffect(() => {
    if (timeoutReached) {
      console.warn('Callback timeout reached, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [timeoutReached, router])

  if (timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-2xl">
          <div className="h-12 w-12 mx-auto mb-6 text-yellow-600">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">処理に時間がかかっています</h2>
          <p className="text-gray-600 mb-4">ダッシュボードにリダイレクトします...</p>
          
          {/* デバッグ情報表示 */}
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">デバッグ情報を表示</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 max-h-40 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-2xl">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">認証処理中...</h2>
        <p className="text-gray-600 mb-4">少々お待ちください</p>
        <p className="text-xs text-gray-400 mt-2">
          処理が完了しない場合は、直接ダッシュボードにアクセスしてください
        </p>
        
        {/* リアルタイムデバッグ情報 */}
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500">処理状況を表示</summary>
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 max-h-40 overflow-y-auto">
            <div className="mb-2 font-semibold">認証状態:</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>Error: {error ? error.message : 'None'}</div>
            
            <div className="mt-2 mb-2 font-semibold">処理ログ:</div>
            {debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}
