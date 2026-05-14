"use client"

import Link from "next/link"
import {
  BarChart3,
  Building2,
  FolderOpen,
  LayoutDashboard,
  Users,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const quickLinks = [
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/users", label: "Users", icon: Users },
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const

export function DashboardOverviewPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Latest project and team updates will appear here
          </p>
          <div className="mt-4 space-y-3" role="presentation">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/5 max-w-[14rem]" />
                  <Skeleton className="h-3 w-2/5 max-w-[8rem]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Query volume</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Usage trend chart will load from live data
          </p>
          <div className="mt-4 flex h-64 flex-col justify-end gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <div className="flex flex-1 items-end gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn("w-full rounded-sm", i % 3 === 0 ? "h-[45%]" : i % 3 === 1 ? "h-[70%]" : "h-[55%]")}
                />
              ))}
            </div>
            <Skeleton className="h-3 w-full rounded-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Quick links</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Jump to common admin areas</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <LayoutDashboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Placeholder layout — charts and feeds will connect to Supabase in a follow-up.
      </p>
    </div>
  )
}
