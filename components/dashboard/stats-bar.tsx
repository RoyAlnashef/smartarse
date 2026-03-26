"use client"

import { Building2, FolderOpen, MessageSquare, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// TODO: wire Supabase — replace with count from `projects` (RLS-aware for role)
const PLACEHOLDER_PROJECTS = 8
// TODO: wire Supabase — define source (e.g. query_log, messages aggregate)
const PLACEHOLDER_QUERIES = 930
// TODO: wire Supabase — count from app users table or policy-exposed view
const PLACEHOLDER_USERS = 7
// TODO: wire Supabase — count from `organizations`
const PLACEHOLDER_ORGANIZATIONS = 4

export function StatsBar() {
  const { user } = useAuth()
  if (!user) return null

  const stats = [
    {
      label: "Queries",
      value: PLACEHOLDER_QUERIES,
      icon: MessageSquare,
      color: "text-arse-pink",
      bgColor: "bg-arse-pink-muted",
    },
    {
      label: "Projects",
      value: PLACEHOLDER_PROJECTS,
      icon: FolderOpen,
      color: "text-dark-500",
      bgColor: "bg-dark-50",
    },
    {
      label: "Users",
      value: PLACEHOLDER_USERS,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Organizations",
      value: PLACEHOLDER_ORGANIZATIONS,
      icon: Building2,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
