"use client"

import { ClientShellHeader } from "@/components/client/client-shell-header"
import { HelpPublicHeader } from "@/components/help/help-public-header"
import { useAuth } from "@/lib/auth-context"

/**
 * Help pages: signed-out visitors see the public help header; authenticated users see the client shell header.
 */
export function HelpLayoutHeader() {
  const { user, isLoading } = useAuth()

  if (!isLoading && user) {
    return <ClientShellHeader />
  }

  return <HelpPublicHeader />
}
