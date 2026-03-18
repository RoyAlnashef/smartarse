"use client"

import { FolderOpen, Zap, Coins, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { projects, clients, users } from "@/lib/mock-data"

export function StatsBar() {
  const { user, getVisibleProjects } = useAuth()
  if (!user) return null

  const visible = getVisibleProjects()
  const activeProjects = visible.filter((p) => p.status === "live").length

  let totalCredits = 0
  let usedCredits = 0
  let activeUsers = 0

  if (user.role === "admin") {
    totalCredits = clients.reduce((s, c) => s + c.totalCredits, 0)
    usedCredits = clients.reduce((s, c) => s + c.usedCredits, 0)
    activeUsers = users.filter((u) => u.status === "active").length
  } else if (user.clientId) {
    const client = clients.find((c) => c.id === user.clientId)
    totalCredits = client?.totalCredits ?? 0
    usedCredits = client?.usedCredits ?? 0
    activeUsers = users.filter(
      (u) => u.clientId === user.clientId && u.status === "active"
    ).length
  }

  const stats = [
    {
      label: "Total Projects",
      value: visible.length,
      icon: FolderOpen,
      color: "text-dark-500",
      bgColor: "bg-dark-50",
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: Zap,
      color: "text-mint-600",
      bgColor: "bg-mint-50",
    },
    {
      label: "Credits Remaining",
      value: totalCredits - usedCredits,
      icon: Coins,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Active Users",
      value: activeUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
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
