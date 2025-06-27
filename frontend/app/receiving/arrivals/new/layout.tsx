import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "入荷処理 | ProcureERP",
  description: "発注データを参照して入荷処理を行います。",
}

export default function NewArrivalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
