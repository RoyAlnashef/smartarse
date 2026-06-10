"use client"

import Link from "next/link"
import { MessageSquare, OctagonPause, Users } from "lucide-react"
import type { Project } from "@/lib/types"
import {
  isAccessDateNearing,
  projectStatusBadgeClassName,
  projectStatusLabel,
} from "@/lib/project-status"
import { formatCalendarDateLocal } from "@/lib/datetime"
import { cn } from "@/lib/utils"
import {
  CREDIT_BALANCE_WARNING_THRESHOLD,
  ProjectCreditsMeter,
} from "@/components/dashboard/project-credits-meter"
import { Skeleton } from "@/components/ui/skeleton"

export function ProjectCard({ project }: { project: Project }) {
  const creditWarning = project.totalCredits < CREDIT_BALANCE_WARNING_THRESHOLD

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-arse-pink transition-colors">
              {project.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{project.clientName}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusBadgeClassName(project.status)}`}
          >
            {projectStatusLabel(project.status)}
          </span>
        </div>

        {/* Meta — users, chats, optional access until */}
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {project.assignedUserIds.length}{" "}
            {project.assignedUserIds.length === 1 ? "user" : "users"}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {project.chatCount} {project.chatCount === 1 ? "chat" : "chats"}
          </span>
          {project.accessUntil ? (
            <span
              className={cn(
                "flex items-center gap-1",
                isAccessDateNearing(project.accessUntil)
                  ? "font-medium text-orange-600 dark:text-orange-400"
                  : "text-muted-foreground"
              )}
              title={`Access until ${formatCalendarDateLocal(project.accessUntil)}`}
            >
              <OctagonPause className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="sr-only">Access until </span>
              {formatCalendarDateLocal(project.accessUntil)}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "border-t px-5 py-3",
          creditWarning
            ? "border-amber-200/90 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40"
            : "border-border"
        )}
      >
        <ProjectCreditsMeter
          creditBalance={project.totalCredits}
          usedCredits={project.usedCredits}
          variant="card"
        />
      </div>
    </Link>
  )
}

/** Placeholder layout aligned with `ProjectCard` (see [shadcn Skeleton](https://ui.shadcn.com/docs/components/radix/skeleton)). */
export function ProjectCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
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
        <div className="mt-auto flex items-center gap-4 pt-4">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <div className="border-t border-border px-5 py-3">
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  )
}
