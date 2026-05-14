"use client"

import { useEffect, useState } from "react"
import { Building2, FolderOpen, MessageSquare, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  fetchDashboardStatsCounts,
  type DashboardStatsCounts,
} from "@/lib/supabase/dashboard-stats"
import { Skeleton } from "@/components/ui/skeleton"

const emptyCounts: DashboardStatsCounts = {
  queries: 0,
  projects: 0,
  users: 0,
  organizations: 0,
}

export function StatsBar() {
  const { user } = useAuth()
  const [counts, setCounts] = useState<DashboardStatsCounts | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoadError(null)
    fetchDashboardStatsCounts()
      .then((next) => {
        if (!cancelled) setCounts(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCounts(emptyCounts)
          setLoadError(err instanceof Error ? err.message : "Failed to load stats.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) return null

  const stats = [
    {
      label: "Queries",
      value: counts?.queries,
      icon: MessageSquare,
      color: "text-arse-pink",
      bgColor: "bg-arse-pink-muted",
    },
    {
      label: "Projects",
      value: counts?.projects,
      icon: FolderOpen,
      color: "text-dark-500",
      bgColor: "bg-dark-50",
    },
    {
      label: "Users",
      value: counts?.users,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Organizations",
      value: counts?.organizations,
      icon: Building2,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-2">
      {loadError ? (
        <p className="text-xs text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              {stat.value === undefined ? (
                <Skeleton className="mb-1.5 h-8 w-14" />
              ) : (
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
