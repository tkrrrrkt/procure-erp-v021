import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "仕入先マスタ | ProcureERP",
  description: "仕入先の登録・管理を行います。",
}

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
