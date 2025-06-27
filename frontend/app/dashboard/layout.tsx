import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ダッシュボード | ProcureERP",
  description: "購買管理システムのダッシュボードです。発注・仕入・請求書照合の概要を確認できます。",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
