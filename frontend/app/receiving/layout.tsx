import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "仕入管理 | ProcureERP",
  description: "仕入データの管理と入力を行います。",
}

export default function ReceivingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
