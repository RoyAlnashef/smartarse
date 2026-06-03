"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Users,
  Mail,
  Bell,
  HelpCircle,
  Shield,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ACTIVE_USER_ROLES, type UserRole } from "@/lib/types"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "client"] },
  { name: "Projects", href: "/projects", icon: FolderOpen, roles: ["admin", "client"] },
  { name: "Users", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Demo requests", href: "/demo-requests", icon: Mail, roles: ["admin"] },
  {
    name: "Support alerts",
    href: "/settings/support-notifications",
    icon: Bell,
    roles: ["admin"],
  },
  { name: "Organizations", href: "/organizations", icon: Building2, roles: ["admin"] },
]

/** Shown in the profile menu instead of the main nav (same role rules as before). */
const profileMenuLinks: {
  name: string
  href: string
  icon: typeof HelpCircle
  roles: UserRole[]
}[] = [
  { name: "FAQ", href: "/faq", icon: HelpCircle, roles: ["admin", "client"] },
  { name: "Privacy", href: "/privacy", icon: Shield, roles: ["admin", "client"] },
]

const roleBadgeColors: Record<UserRole, string> = {
  admin:
    "bg-[color-mix(in_srgb,var(--arse-cyan)_20%,transparent)] text-arse-cyan",
  client: "bg-blue-400/20 text-blue-400",
  user: "bg-amber-400/20 text-amber-400",
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, switchRole, logout } = useAuth()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!user) return null

  const filteredNav = navigation.filter((item) => item.roles.includes(user.role))
  const filteredProfileLinks = profileMenuLinks.filter((item) =>
    item.roles.includes(user.role)
  )

  return (
    <div className="flex h-full flex-col bg-dark-950 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Image
          src="/disrupt-logo-white.png"
          alt="Disrupt"
          width={240}
          height={83}
          className="h-8 w-auto"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-arse-cyan"
                  : "text-dark-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 ${
                  isActive ? "text-arse-cyan" : "text-dark-400 group-hover:text-white"
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Role Switcher (demo) */}
      <div className="border-t border-white/10 px-3 py-3">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-dark-400">
          Demo Role
        </p>
        <div className="flex gap-1">
          {ACTIVE_USER_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => switchRole(role)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                user.role === role
                  ? "bg-arse-cyan text-arse-black"
                  : "text-dark-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* User profile — opens account menu (Settings / Sign out) */}
      <div ref={profileMenuRef} className="relative border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setProfileMenuOpen((o) => !o)}
          aria-expanded={profileMenuOpen}
          aria-haspopup="menu"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:ring-2 focus-visible:ring-arse-pink/50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-700 text-sm font-medium text-white">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="min-w-0 flex-1 truncate">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-dark-400">{user.email}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[user.role]}`}
          >
            {user.role}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-dark-400 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {profileMenuOpen && (
          <div
            role="menu"
            className="absolute z-50 w-56 rounded-lg border border-border bg-card py-1 text-foreground shadow-lg max-lg:bottom-full max-lg:left-0 max-lg:right-0 max-lg:mb-2 max-lg:w-auto lg:bottom-0 lg:left-full lg:ml-2 lg:w-56"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            {filteredProfileLinks.map((item) => (
              <button
                key={item.href}
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false)
                  router.push(item.href)
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileMenuOpen(false)
                router.push("/settings")
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setProfileMenuOpen(false)
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
    </div>
  )
}
