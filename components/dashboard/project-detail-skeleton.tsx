"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** Loading placeholder for dashboard project detail (header + tabbed workspace). */
export function ProjectDetailSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-[min(100%,14rem)]" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="ml-2 h-5 w-16 shrink-0 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full min-w-[320px] max-w-[480px] shrink-0 rounded-xl" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-border px-4 py-2 lg:px-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="min-h-[12rem] w-full flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
