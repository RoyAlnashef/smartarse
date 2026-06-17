"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { SupportContactProvider } from "@/lib/support-contact-context"
import { ThemeProvider } from "@/components/theme-provider"
import { MobileBrowserZoomReset } from "@/components/mobile-browser-zoom-reset"
import { Toaster } from "@/components/ui/sonner"

export function AppProviders({
  supportEmail,
  children,
}: {
  supportEmail: string
  children: ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SupportContactProvider supportEmail={supportEmail}>
        <AuthProvider>
          <MobileBrowserZoomReset />
          {children}
          <Toaster />
        </AuthProvider>
      </SupportContactProvider>
    </ThemeProvider>
  )
}
