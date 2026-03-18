"use client"

import { Search } from "lucide-react"

const statuses = ["all", "live", "archived"] as const

export function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              status === s
                ? "bg-dark-950 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
