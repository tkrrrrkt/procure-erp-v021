'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Auth0Provider, useAuth0, User } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'

interface TenantContextType {
  selectedTenant: string | null
  setSelectedTenant: (tenant: string | null) => void
}

const TenantContext = createContext<TenantContextType>({
  selectedTenant: null,
  setSelectedTenant: () => {},
})

interface Auth0ProviderWithNavigateProps {
  children: React.ReactNode
}

export function Auth0ProviderWithNavigate({ children }: Auth0ProviderWithNavigateProps) {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!
  const redirectUri = process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || `${window.location.origin}/callback`
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
  const scope = process.env.NEXT_PUBLIC_AUTH0_SCOPE || 'openid profile email'

  const onRedirectCallback = (appState?: any) => {
    console.log('Auth0 redirect callback:', appState)
    // デフォルトでダッシュボードにリダイレクト
    window.location.assign(appState?.returnTo || '/dashboard')
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: scope,
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <TenantContext.Provider value={{ selectedTenant, setSelectedTenant }}>
        {children}
      </TenantContext.Provider>
    </Auth0Provider>
  )
}

export const useTenant = () => useContext(TenantContext)

// 拡張認証フック
export const useAuth = () => {
  const auth0 = useAuth0()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  
  useEffect(() => {
    const getToken = async () => {
      if (auth0.isAuthenticated) {
        try {
          const token = await auth0.getAccessTokenSilently({
            authorizationParams: {
              audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
            },
          })
          setAccessToken(token)
        } catch (error) {
          console.error('Failed to get access token:', error)
        }
      }
    }
    
    getToken()
  }, [auth0.isAuthenticated, auth0])

  // 組織指定ログイン関数
  const loginWithOrganization = async (organizationId: string) => {
    try {
      await auth0.loginWithRedirect({
        authorizationParams: {
          organization: organizationId,
          audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          scope: 'openid profile email org_id',
        },
      })
    } catch (error) {
      console.error('Organization login failed:', error)
      throw error
    }
  }

  // 組織選択ログイン（複数組織対応）
  const loginWithOrganizationSelection = async () => {
    try {
      await auth0.loginWithRedirect({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          scope: 'openid profile email org_id',
          prompt: 'select_account',
        },
      })
    } catch (error) {
      console.error('Organization selection login failed:', error)
      throw error
    }
  }

  // JWTからOrganization情報抽出
  const getOrganizationInfo = () => {
    if (!auth0.user) return null
    
    const namespace = 'https://api.procure-erp.com/'
    return {
      org_id: (auth0.user as any)[`${namespace}org_id`] || null,
      org_name: (auth0.user as any)[`${namespace}org_name`] || null,
      tenant_id: (auth0.user as any)[`${namespace}tenant_id`] || null,
    }
  }

  return {
    ...auth0,
    accessToken,
    loginWithOrganization,
    loginWithOrganizationSelection,
    getOrganizationInfo,
  }
}
