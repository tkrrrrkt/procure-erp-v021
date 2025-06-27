import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Auth0ProviderWithNavigate } from "@/lib/auth/auth0-provider"
import { LayoutContent } from "./layout-content"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ProcureERP - Modern Purchasing Management",
  description: "Enterprise purchasing management system",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Auth0ProviderWithNavigate>
            <LayoutContent>{children}</LayoutContent>
          </Auth0ProviderWithNavigate>
        </ThemeProvider>
      </body>
    </html>
  )
}
