import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "注文書発行 | ProcureERP",
  description: "承認済みの発注データから注文書を発行します。",
}

export default function PurchaseOrderIssueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
