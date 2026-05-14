import { ClientShellFooter } from "@/components/client/client-shell-footer"
import { HelpLayoutHeader } from "@/components/help/help-layout-header"
import type { ReactNode } from "react"

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HelpLayoutHeader />
      <main className="flex-1">{children}</main>
      <ClientShellFooter />
    </div>
  )
}

