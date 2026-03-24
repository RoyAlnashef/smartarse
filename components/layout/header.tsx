"use client"

import { usePathname } from "next/navigation"
import { Menu, Coins } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { clients } from "@/lib/mock-data"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/organizations": "Organizations",
  "/files": "Files",
  "/users": "User Management",
  "/analytics": "Analytics",
  "/faq": "FAQ",
  "/privacy": "Data Protection",
  "/settings": "Settings",
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const pageTitle =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    "Dashboard"

  const isProjectPage = pathname.startsWith("/projects/")

  const totalCredits =
    user.role === "admin"
      ? clients.reduce((sum, c) => sum + c.totalCredits, 0)
      : user.clientId
        ? (clients.find((c) => c.id === user.clientId)?.totalCredits ?? 0)
        : 0
  const usedCredits =
    user.role === "admin"
      ? clients.reduce((sum, c) => sum + c.usedCredits, 0)
      : user.clientId
        ? (clients.find((c) => c.id === user.clientId)?.usedCredits ?? 0)
        : 0

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-dark-400 hover:bg-muted hover:text-foreground lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-foreground">
        {isProjectPage ? "Project" : pageTitle}
      </h1>

      <div className="flex-1" />

      {/* Credit counter */}
      <div className="hidden items-center gap-2 rounded-lg bg-muted px-3 py-1.5 sm:flex">
        <Coins className="h-4 w-4 text-mint-500" />
        <span className="text-sm font-medium text-foreground">
          {totalCredits - usedCredits}
        </span>
        <span className="text-sm text-muted-foreground">credits</span>
      </div>
    </header>
  )
}
