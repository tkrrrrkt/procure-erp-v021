import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { CsrfHandler } from './csrf-handler'

// APIクライアントのインスタンス
let apiClient: AxiosInstance | null = null
let csrfHandler: CsrfHandler | null = null

// アクセストークンを取得する関数の型
type GetAccessTokenFunction = () => Promise<string | null>

// APIクライアントを初期化
export function initializeApiClient(getAccessToken: GetAccessTokenFunction): AxiosInstance {
  if (apiClient) {
    return apiClient
  }

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  apiClient = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // リクエストインターセプター：認証トークンを自動的に付与
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get access token:', error)
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // CSRF保護を初期化
  csrfHandler = new CsrfHandler(apiClient, {
    debug: process.env.NODE_ENV === 'development'
  })
  
  // CSRF保護を非同期で初期化（エラーは警告レベル）
  csrfHandler.initialize().catch((error) => {
    console.warn('CSRF protection initialization failed:', error)
  })

  // レスポンスインターセプター：エラーハンドリング
  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // 認証エラーの場合
        console.error('Authentication error - redirecting to login')
        // ここでログアウト処理やリダイレクトを実行
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      } else if (error.response?.status === 403) {
        // 権限エラーの場合
        console.error('Permission denied')
      } else if (error.response?.status === 404) {
        // リソースが見つからない
        console.error('Resource not found')
      } else if (error.response?.status >= 500) {
        // サーバーエラー
        console.error('Server error:', error.response?.data)
      }
      
      return Promise.reject(error)
    }
  )

  return apiClient
}

// APIクライアントを取得（初期化されていない場合はエラー）
export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    throw new Error('API client not initialized. Call initializeApiClient first.')
  }
  return apiClient
}

// 汎用的なAPIリクエスト関数
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    getApiClient().get<T>(url, config),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    getApiClient().post<T>(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    getApiClient().put<T>(url, data, config),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    getApiClient().patch<T>(url, data, config),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    getApiClient().delete<T>(url, config),
}

// CSRF保護関連の関数をエクスポート
export const csrf = {
  // セッションのCSRFトークンをクリア
  clearSession: async (): Promise<void> => {
    if (csrfHandler) {
      await csrfHandler.clearSession()
    }
  },
  
  // CSRF保護が初期化済みかチェック
  isInitialized: (): boolean => {
    return csrfHandler !== null
  }
}

// APIエンドポイント定義
export const endpoints = {
  // 認証関連
  auth: {
    profile: '/api/v1/auth/profile',
    logout: '/api/v1/auth/logout',
  },
  
  // CSRF保護関連
  csrf: {
    token: '/api/v1/csrf/token',
    statistics: '/api/v1/csrf/statistics',
    health: '/api/v1/csrf/health',
    cleanup: '/api/v1/csrf/cleanup',
    session: '/api/v1/csrf/session',
  },
  
  // 購買依頼
  purchaseRequests: {
    list: '/api/v1/purchase-requests',
    get: (id: string) => `/api/v1/purchase-requests/${id}`,
    create: '/api/v1/purchase-requests',
    update: (id: string) => `/api/v1/purchase-requests/${id}`,
    delete: (id: string) => `/api/v1/purchase-requests/${id}`,
    approve: (id: string) => `/api/v1/purchase-requests/${id}/approve`,
    reject: (id: string) => `/api/v1/purchase-requests/${id}/reject`,
  },
  
  // 発注
  purchaseOrders: {
    list: '/api/v1/purchase-orders',
    get: (id: string) => `/api/v1/purchase-orders/${id}`,
    create: '/api/v1/purchase-orders',
    update: (id: string) => `/api/v1/purchase-orders/${id}`,
    cancel: (id: string) => `/api/v1/purchase-orders/${id}/cancel`,
  },
  
  // ベンダー
  vendors: {
    list: '/api/v1/vendors',
    get: (id: string) => `/api/v1/vendors/${id}`,
    create: '/api/v1/vendors',
    update: (id: string) => `/api/v1/vendors/${id}`,
    delete: (id: string) => `/api/v1/vendors/${id}`,
  },
  
  // 組織
  organizations: {
    current: '/api/v1/organizations/current',
    settings: '/api/v1/organizations/settings',
    users: '/api/v1/organizations/users',
  },
}

// エラーレスポンスの型定義
export interface ApiError {
  message: string
  statusCode: number
  error?: string
  details?: any
}

// ページネーションレスポンスの型定義
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
