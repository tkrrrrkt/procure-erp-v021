import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "マッチング詳細 | ProcureERP",
  description: "発注データと請求書データのマッチング詳細を表示します。",
}

export default function InvoiceMatchingDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
