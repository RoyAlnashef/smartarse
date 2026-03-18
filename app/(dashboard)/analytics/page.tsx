"use client"

import { useAuth } from "@/lib/auth-context"
import { queryLogs, queryChartData, queriesByProject } from "@/lib/mock-data"
import { BarChart3, Users, TrendingUp, Award } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const stats = [
  { label: "Total Queries", value: "543", icon: BarChart3, color: "text-mint-600", bg: "bg-mint-50" },
  { label: "Active Users", value: "6", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Avg Queries/Day", value: "12.4", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Top Project", value: "SaaS Landscape", icon: Award, color: "text-dark-600", bg: "bg-dark-50" },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AnalyticsPage() {
  const { user } = useAuth()

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">Only admins can view analytics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track usage patterns and query activity across the platform
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queries over time */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground">Queries Over Time</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Weekly query volume</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={queryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="queries"
                  stroke="#74f0bd"
                  strokeWidth={2}
                  dot={{ fill: "#74f0bd", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Queries by project */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground">Queries by Project</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Total queries per project</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queriesByProject}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="project" tick={{ fontSize: 11 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
                <Bar dataKey="queries" fill="#262626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent queries table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Queries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 font-medium text-muted-foreground">User</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Project</th>
                <th className="hidden px-6 py-3 font-medium text-muted-foreground md:table-cell">Query</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {queryLogs.slice(0, 8).map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium text-foreground">{log.userName}</td>
                  <td className="px-6 py-3 text-muted-foreground">{log.projectName}</td>
                  <td className="hidden max-w-xs truncate px-6 py-3 text-muted-foreground md:table-cell">
                    {log.query}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
