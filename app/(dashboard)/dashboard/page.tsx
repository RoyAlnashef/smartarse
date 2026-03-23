"use client"

import { useAuth } from "@/lib/auth-context"
import { StatsBar } from "@/components/dashboard/stats-bar"
import Link from "next/link"
import { FolderOpen } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "admin"
              ? "Overview of projects, credits, and team activity"
              : "Overview of your projects and usage"}
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <FolderOpen className="h-4 w-4" />
          View projects
        </Link>
      </div>

      <StatsBar />
    </div>
  )
}
