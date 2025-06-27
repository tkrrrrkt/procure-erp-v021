import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Web発注照会 | ProcureERP",
  description: "仕入先向けの発注書Web照会画面です。発注書PDFの表示やダウンロードができます。",
}

export default function WebPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
