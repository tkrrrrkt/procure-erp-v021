import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "請求書マッチング一覧 | ProcureERP",
  description: "発注データと請求書データのマッチング結果一覧を表示します。",
}

export default function InvoiceMatchingListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
