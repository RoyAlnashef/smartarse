"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Users,
  BarChart3,
  HelpCircle,
  Shield,
  Settings,
  ChevronDown,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ACTIVE_USER_ROLES, type UserRole } from "@/lib/types"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "client"] },
  { name: "Projects", href: "/projects", icon: FolderOpen, roles: ["admin", "client"] },
  { name: "Upload", href: "/upload", icon: Upload, roles: ["admin"] },
  { name: "Users", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin"] },
  { name: "FAQ", href: "/faq", icon: HelpCircle, roles: ["admin", "client"] },
  { name: "Privacy", href: "/privacy", icon: Shield, roles: ["admin", "client"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "client"] },
]

const roleBadgeColors: Record<UserRole, string> = {
  admin: "bg-mint-300/20 text-mint-300",
  client: "bg-blue-400/20 text-blue-400",
  user: "bg-amber-400/20 text-amber-400",
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, switchRole } = useAuth()

  if (!user) return null

  const filteredNav = navigation.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-full flex-col bg-dark-950 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-300">
          <span className="font-serif text-sm font-bold text-dark-950">D</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">Disrupt</span>
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
                  ? "bg-white/10 text-mint-300"
                  : "text-dark-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 ${
                  isActive ? "text-mint-300" : "text-dark-400 group-hover:text-white"
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
                  ? "bg-mint-300 text-dark-950"
                  : "text-dark-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-700 text-sm font-medium text-white">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-dark-400">{user.email}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[user.role]}`}
          >
            {user.role}
          </span>
        </div>
      </div>
    </div>
  )
}
