// 認証関連のユーティリティ関数

export interface User {
  sub: string
  name: string
  email: string
  preferred_username: string
  groups?: string[]
  permissions?: string[]
}

export interface AuthState {
  isAuthenticated: boolean
  user?: User
  accessToken?: string
  idToken?: string
}

// ローカルストレージからトークンを取得
export const getStoredTokens = () => {
  if (typeof window === "undefined") return null

  try {
    const tokens = localStorage.getItem("auth0-token-storage")
    return tokens ? JSON.parse(tokens) : null
  } catch {
    return null
  }
}

// トークンをローカルストレージに保存
export const storeTokens = (tokens: any) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("auth0-token-storage", JSON.stringify(tokens))
  } catch (error) {
    console.error("Failed to store tokens:", error)
  }
}

// トークンをクリア
export const clearTokens = () => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("auth0-token-storage")
  } catch (error) {
    console.error("Failed to clear tokens:", error)
  }
}

// ユーザーの権限をチェック
export const hasPermission = (user: User | undefined, permission: string): boolean => {
  if (!user || !user.permissions) return false
  return user.permissions.includes(permission)
}

// ユーザーのロールをチェック
export const hasRole = (user: User | undefined, role: string): boolean => {
  if (!user || !user.groups) return false
  return user.groups.includes(role)
}

// 管理者権限をチェック
export const isAdmin = (user: User | undefined): boolean => {
  return hasRole(user, "admin") || hasRole(user, "Administrator")
}

// 購買部門権限をチェック
export const isPurchasingUser = (user: User | undefined): boolean => {
  return hasRole(user, "purchasing") || hasRole(user, "Purchasing")
}

// 在庫管理権限をチェック
export const isInventoryUser = (user: User | undefined): boolean => {
  return hasRole(user, "inventory") || hasRole(user, "Inventory")
}
