"use client"

import { createContext, useContext, type ReactNode } from "react"
import { SUPPORT_EMAIL } from "@/lib/support-contact"

const SupportContactContext = createContext(SUPPORT_EMAIL)

export function SupportContactProvider({
  supportEmail,
  children,
}: {
  supportEmail: string
  children: ReactNode
}) {
  const email = supportEmail.trim() || SUPPORT_EMAIL
  return (
    <SupportContactContext.Provider value={email}>
      {children}
    </SupportContactContext.Provider>
  )
}

export function useSupportContactEmail(): string {
  return useContext(SupportContactContext)
}
