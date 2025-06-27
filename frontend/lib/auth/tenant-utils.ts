// テナント関連のユーティリティ関数

import { multiTenantConfig, type TenantConfig } from "./multi-tenant-config"

export const detectTenantFromEmail = (email: string): TenantConfig | undefined => {
  if (!email.includes("@")) return undefined

  const domain = email.split("@")[1]
  return multiTenantConfig.getTenantByDomain(domain)
}

export const detectTenantFromHostname = (hostname: string): TenantConfig | undefined => {
  // サブドメインからテナントを検出
  const subdomain = hostname.split(".")[0]
  const allTenants = multiTenantConfig.getAllTenants()

  return allTenants.find(
    (tenant) =>
      tenant.id === subdomain || tenant.customDomain === hostname || hostname.includes(tenant.domain.split(".")[0]),
  )
}

export const getTenantFromUrl = (): string | null => {
  if (typeof window === "undefined") return null

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("tenant")
}

export const setTenantInUrl = (tenantId: string) => {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)
  url.searchParams.set("tenant", tenantId)
  window.history.replaceState({}, "", url.toString())
}

export const getTenantSpecificRedirectUrl = (tenantId: string, path = "/dashboard"): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  return `${baseUrl}${path}?tenant=${tenantId}`
}

export const validateTenantAccess = (userTenantId: string, requestedTenantId: string): boolean => {
  // 基本的な検証 - 実際の実装ではより複雑な権限チェックが必要
  return userTenantId === requestedTenantId
}

export const getTenantBranding = (tenantId: string) => {
  const tenant = multiTenantConfig.getTenantConfig(tenantId)
  if (!tenant) return null

  return {
    name: tenant.name,
    logo: tenant.logo,
    primaryColor: tenant.primaryColor || "#2563eb",
    customDomain: tenant.customDomain,
  }
}

export const getTenantFeatures = (tenantId: string): string[] => {
  const tenant = multiTenantConfig.getTenantConfig(tenantId)
  return tenant?.features || []
}

export const isTenantFeatureEnabled = (tenantId: string, feature: string): boolean => {
  const features = getTenantFeatures(tenantId)
  return features.includes(feature)
}
