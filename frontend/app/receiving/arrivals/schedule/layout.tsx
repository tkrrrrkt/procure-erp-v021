import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "入荷予定照会 | ProcureERP",
  description: "入荷予定データの照会を行います。",
}

export default function ArrivalScheduleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
