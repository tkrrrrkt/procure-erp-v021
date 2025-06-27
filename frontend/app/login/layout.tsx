import type React from "react"

export const metadata = {
  title: "ログイン - ProcureERP",
  description: "ProcureERP ログイン画面",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">{children}</div>
}
