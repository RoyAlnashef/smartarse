"use client"

import { ClientShellHeader } from "@/components/client/client-shell-header"

/**
 * Help pages: same client shell header for everyone; guests see Sign In instead of settings/logout.
 */
export function HelpLayoutHeader() {
  return <ClientShellHeader variant="help" />
}
