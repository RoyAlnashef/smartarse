"use client"

import { ClientShellHeader } from "@/components/client/client-shell-header"
import { HelpPublicHeader } from "@/components/help/help-public-header"
import { HelpSectionNav } from "@/components/help/help-section-nav"
import { useAuth } from "@/lib/auth-context"

/**
 * Help pages: signed-out visitors (e.g. from sign-in footer) see the public help header.
 * Any authenticated user sees the same header as the client shell, plus help section links.
 */
export function HelpLayoutHeader() {
  const { user, isLoading } = useAuth()

  if (!isLoading && user) {
    return (
      <>
        <ClientShellHeader />
        <div className="border-b-2 border-arse-black/10 bg-white py-3">
          <HelpSectionNav />
        </div>
      </>
    )
  }

  return <HelpPublicHeader />
}
