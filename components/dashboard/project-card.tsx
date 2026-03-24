"use client"

import Link from "next/link"
import { Calendar, Coins, FileText } from "lucide-react"
import type { Project } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function creditsUsedLabel(n: number) {
  return `${n} credit${n === 1 ? "" : "s"} used`
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-mint-600 transition-colors">
              {project.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{project.clientName}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              project.status === "live"
                ? "bg-mint-100 text-mint-700"
                : "bg-dark-100 text-dark-500"
            }`}
          >
            {project.status === "live" ? "Live" : "Archived"}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        {/* Meta */}
        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(project.lastActivity)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {project.uploadedFileIds.length} docs
          </span>
        </div>
      </div>

      {/* Credits used — matches project detail mint coin treatment */}
      <div className="border-t border-border px-5 py-3">
        <span className="flex items-center gap-1.5 text-xs">
          <Coins className="h-3.5 w-3.5 shrink-0 text-mint-500" aria-hidden />
          <span className="font-medium text-foreground">
            {creditsUsedLabel(project.usedCredits)}
          </span>
        </span>
      </div>
    </Link>
  )
}

/** Placeholder layout aligned with `ProjectCard` (see [shadcn Skeleton](https://ui.shadcn.com/docs/components/radix/skeleton)). */
export function ProjectCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card"
      aria-busy
      aria-label="Loading project"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[min(100%,14rem)]" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-[92%]" />
        </div>
        <div className="mt-auto flex items-center gap-4 pt-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </div>
      <div className="border-t border-border px-5 py-3">
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  )
}
