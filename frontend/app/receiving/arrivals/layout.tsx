import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "入荷管理 | ProcureERP",
  description: "入荷データの管理と処理を行います。",
}

export default function ArrivalsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
