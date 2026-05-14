"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { useAuth } from "@/lib/auth-context"
import { DASHBOARD_MAIN_ACCENT_CLASS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/")
      return
    }
    if (user && user.role !== "admin") {
      router.replace("/client/projects")
    }
  }, [isAuthenticated, isLoading, user, router])

  // Show spinner while auth is hydrating
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-arse-cyan border-t-transparent" />
      </div>
    )
  }

  // Still waiting for redirect to happen
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-arse-cyan border-t-transparent" />
      </div>
    )
  }

  // Admin shell only — client / end-user go to themed client area
  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-arse-cyan border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-72 shrink-0 lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden",
          DASHBOARD_MAIN_ACCENT_CLASS,
        )}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-30 rounded-lg border border-border bg-card p-2 text-dark-400 shadow-sm hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pt-14 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
