import { HelpLayoutHeader } from "@/components/help/help-layout-header"
import type { ReactNode } from "react"

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <HelpLayoutHeader />
      <main>{children}</main>
    </div>
  )
}

