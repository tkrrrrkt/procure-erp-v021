'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth0 } from '@auth0/auth0-react'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
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
    const timeoutTimer = setTimeout(() => {
      addDebugInfo('Timeout reached - redirecting to dashboard')
      setTimeoutReached(true)
      router.push('/dashboard')
    }, 10000)

    // 認証処理
    const handleAuth = async () => {
      try {
        if (errorParam) {
          addDebugInfo(`Auth error from URL: ${errorParam}`)
          throw new Error(`Authentication error: ${errorParam}`)
        }

        if (code && !isAuthenticated && !isLoading) {
          addDebugInfo('Processing authentication callback')
          await handleRedirectCallback()
          addDebugInfo('Callback processed successfully')
        }

        if (isAuthenticated) {
          addDebugInfo('User is authenticated - redirecting to dashboard')
          clearTimeout(timeoutTimer)
          router.push('/dashboard')
        }
      } catch (err) {
        addDebugInfo(`Auth error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.error('Authentication error:', err)
        setTimeout(() => {
          router.push('/login?error=callback_failed')
        }, 2000)
      }
    }

    handleAuth()

    return () => {
      clearTimeout(timeoutTimer)
    }
  }, [isAuthenticated, isLoading, error, searchParams, router, handleRedirectCallback])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-6">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-6 text-red-600">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">認証エラー</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button 
              onClick={() => router.push('/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ログインページに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

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

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
