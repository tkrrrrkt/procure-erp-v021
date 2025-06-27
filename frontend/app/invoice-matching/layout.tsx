import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "請求書マッチング | ProcureERP",
  description: "発注データと請求書データを突合して、マッチング結果を確認します。",
}

export default function InvoiceMatchingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
