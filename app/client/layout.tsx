"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ClientShellHeader } from "@/components/client/client-shell-header"
import { ClientShellFooter } from "@/components/client/client-shell-footer"
import { useAuth } from "@/lib/auth-context"
import { useDemoSession } from "@/hooks/useDemoSession"
import { demoProjectRedirectPath } from "@/lib/demo-access/session"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const allowedClientShell =
    user?.role === "client" || user?.role === "user"
  const { isDemoUser, demoProjectId, isLoading: demoSessionLoading } =
    useDemoSession(allowedClientShell && !isLoading)

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

  useEffect(() => {
    if (isLoading || demoSessionLoading || !isDemoUser || !demoProjectId) return
    if (pathname === "/client/projects") {
      router.replace(demoProjectRedirectPath(demoProjectId))
    }
  }, [
    isLoading,
    demoSessionLoading,
    isDemoUser,
    demoProjectId,
    pathname,
    router,
  ])

  if (isLoading || !user || !allowedClientShell) {
    return (
      <div className="arse-surface-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
      </div>
    )
  }

  // `--client-workspace-chrome-y` caps client project chat / personas shells (header + footer + page padding + breadcrumb); see `persona-chat-shell-classes.ts`.
  return (
    <div className="flex min-h-screen flex-col bg-white font-arse-body text-arse-black [--client-workspace-chrome-y:20rem] lg:[--client-workspace-chrome-y:17.5rem]">
      <ClientShellHeader />
      <div className="min-h-0 flex-1">{children}</div>
      <ClientShellFooter />
    </div>
  )
}
