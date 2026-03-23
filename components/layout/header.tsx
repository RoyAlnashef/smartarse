"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu,
  Search,
  Coins,
  ChevronDown,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { clients } from "@/lib/mock-data"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/upload": "Upload Management",
  "/users": "User Management",
  "/analytics": "Analytics",
  "/faq": "FAQ",
  "/privacy": "Data Protection",
  "/settings": "Settings",
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

      {/* User dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-950 text-sm font-medium text-white">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <span className="hidden text-sm font-medium text-foreground md:block">
            {user.name}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card py-1 shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false)
                router.push("/settings")
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={async () => {
                setDropdownOpen(false)
                await logout()
                router.replace("/")
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
