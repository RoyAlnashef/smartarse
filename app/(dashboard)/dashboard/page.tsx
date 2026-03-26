"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardOverviewPlaceholder } from "@/components/dashboard/dashboard-overview-placeholder"
import { StatsBar } from "@/components/dashboard/stats-bar"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.role === "admin"
            ? "Overview of projects, queries, organizations, and team activity"
            : "Overview of your projects and usage"}
        </p>
      </div>

      <StatsBar />

      <DashboardOverviewPlaceholder />
    </div>
  )
}
