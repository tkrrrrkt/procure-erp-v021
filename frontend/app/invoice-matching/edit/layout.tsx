import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "発注データ修正 | ProcureERP",
  description: "請求書データに合わせて発注データを修正します。",
}

export default function InvoiceMatchingEditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
