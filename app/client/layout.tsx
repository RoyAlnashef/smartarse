"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClientShellHeader } from "@/components/client/client-shell-header"
import { ClientShellFooter } from "@/components/client/client-shell-footer"
import { useAuth } from "@/lib/auth-context"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/")
      return
    }
    if (user.role === "admin") {
      router.replace("/dashboard")
      return
    }
    if (user.role !== "client" && user.role !== "user") {
      router.replace("/")
    }
  }, [user, isLoading, router])

  const allowedClientShell =
    user?.role === "client" || user?.role === "user"

  if (isLoading || !user || !allowedClientShell) {
    return (
      <div className="arse-surface-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-arse-body text-arse-black">
      <ClientShellHeader />
      <div className="flex-1">{children}</div>
      <ClientShellFooter />
    </div>
  )
}
