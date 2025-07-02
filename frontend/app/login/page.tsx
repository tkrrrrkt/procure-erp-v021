"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, useTenant } from "@/lib/auth/auth0-provider"

interface Tenant {
  id: string
  name: string
  domain: string
  primaryColor?: string
}

interface LoginFormProps {
  email: string
  setEmail: (email: string) => void
  currentOrganization: string
  setCurrentOrganization: (org: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string
  setError: (error: string) => void
  loginWithRedirect: any
  setSelectedTenant: (tenant: string) => void
}

// useSearchParams を使用するコンポーネントを分離
function LoginFormWithParams(props: LoginFormProps) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const organizationParam = searchParams.get('organization')
    console.log('Organization param from useSearchParams:', organizationParam)
    
    if (organizationParam) {
      props.setCurrentOrganization(organizationParam)
      props.setSelectedTenant(organizationParam)
      props.setError("") // エラーをクリア
    } else {
      props.setError("組織パラメータが必要です。正しいURLからアクセスしてください。")
    }
  }, [searchParams, props])

  const handleAuth0Login = async () => {
    props.setIsLoading(true)
    props.setError("")

    try {
      if (!props.currentOrganization) {
        throw new Error("組織が特定できません。正しいURLからアクセスしてください。")
      }

      // Auth0のUniversal Loginにリダイレクト（組織パラメータ付き）
      // stateパラメータに組織情報を含める
      const customState = btoa(`organization=${props.currentOrganization}`)
      
      if (props.email) {
        await props.loginWithRedirect({
          authorizationParams: {
            organization: props.currentOrganization,
            login_hint: props.email,
            state: customState,
          },
          appState: { returnTo: '/dashboard' }
        })
      } else {
        await props.loginWithRedirect({
          authorizationParams: {
            organization: props.currentOrganization,
            state: customState,
          },
          appState: { returnTo: '/dashboard' }
        })
      }
    } catch (err) {
      props.setError(err instanceof Error ? err.message : "認証に失敗しました。再度お試しください。")
      props.setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleAuth0Login()
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          メールアドレス (オプション)
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={props.email}
            onChange={(e) => props.setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          メールアドレスを入力すると、組織内での認証が簡略化されます
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={props.isLoading || !props.currentOrganization}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {props.isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              認証中...
            </>
          ) : (
            `${props.currentOrganization ? props.currentOrganization + ' 組織で' : ''}サインイン`
          )}
        </button>
      </div>
    </form>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth()
  const { setSelectedTenant } = useTenant()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [currentOrganization, setCurrentOrganization] = useState<string>("")

  // 認証済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ProcureERP
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {currentOrganization ? `${currentOrganization} 組織` : '統合調達管理システム'}にサインイン
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">エラー</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          }>
            <LoginFormWithParams
              email={email}
              setEmail={setEmail}
              currentOrganization={currentOrganization}
              setCurrentOrganization={setCurrentOrganization}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              error={error}
              setError={setError}
              loginWithRedirect={loginWithRedirect}
              setSelectedTenant={setSelectedTenant}
            />
          </Suspense>

          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-gray-500">
                安全な認証のため、Auth0を使用しています
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
