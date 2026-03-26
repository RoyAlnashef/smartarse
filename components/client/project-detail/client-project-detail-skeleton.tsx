"use client"

import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Loading placeholder for `/client/projects/[id]` (layout aligned with the live page). */
export function ClientProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href="/client/projects"
          className="shrink-0 font-arse-body text-sm font-medium text-arse-black/70 hover:text-arse-pink"
        >
          ← Projects
        </Link>
        <span
          className="select-none font-arse-body text-sm text-arse-black/35"
          aria-hidden
        >
          /
        </span>
        <Skeleton className="h-4 w-44 max-w-[min(100%,12rem)] rounded bg-arse-black/10" />
      </div>

      <div
        className={cn(
          "mt-6 grid grid-cols-1 items-start gap-6 lg:gap-8",
          "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]"
        )}
      >
        <aside className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-3xl bg-arse-cyan">
            <Skeleton className="h-9 w-full rounded-none bg-arse-pink/80" />
            <div className="space-y-3 px-4 py-4">
              <Skeleton className="h-16 w-full rounded-2xl bg-arse-black/10" />
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-dark-950">
            <Skeleton className="h-9 w-full rounded-none bg-arse-pink/80" />
            <div className="space-y-2 px-4 py-4">
              <Skeleton className="h-6 w-full max-w-[75%] bg-arse-white/20" />
              <Skeleton className="h-4 w-full bg-arse-white/15" />
              <Skeleton className="h-4 w-[90%] bg-arse-white/15" />
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-dark-950">
            <Skeleton className="h-9 w-full rounded-none bg-arse-pink/80" />
            <div className="space-y-2 px-4 py-4">
              <Skeleton className="h-4 w-1/2 bg-arse-white/15" />
              <Skeleton className="h-4 w-full bg-arse-white/15" />
            </div>
          </div>
        </aside>

        <div className="order-first min-h-[20rem] min-w-0 rounded-3xl border-4 border-arse-pink bg-white p-4 lg:order-none">
          <Skeleton className="h-10 w-48 rounded-full bg-arse-cyan/50" />
          <Skeleton className="mt-8 h-32 w-full max-w-md rounded-2xl bg-arse-black/5" />
          <div className="mt-auto flex items-end gap-2 pt-16">
            <Skeleton className="h-12 flex-1 rounded-full bg-arse-cyan/40" />
            <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-arse-black/80" />
          </div>
        </div>

        <div className="hidden min-h-0 min-w-0 lg:block">
          <div className="overflow-hidden rounded-3xl border border-arse-black/15 bg-arse-cyan/30 p-4">
            <Skeleton className="mx-auto h-8 w-24 bg-arse-black/10" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-20 w-full rounded-xl bg-arse-black/10" />
              <Skeleton className="h-20 w-full rounded-xl bg-arse-black/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
