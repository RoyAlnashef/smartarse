"use client"

import Link from "next/link"
import { Calendar, Coins, MessageSquare } from "lucide-react"
import type { Project } from "@/lib/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatFileSize(credits: number, total: number) {
  const pct = total > 0 ? Math.round((credits / total) * 100) : 0
  return pct
}

export function ProjectCard({ project }: { project: Project }) {
  const creditPct = formatFileSize(project.usedCredits, project.totalCredits)
  const remaining = project.totalCredits - project.usedCredits

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
            <MessageSquare className="h-3.5 w-3.5" />
            {project.uploadedFileIds.length} files
          </span>
        </div>
      </div>

      {/* Credit bar */}
      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            {remaining} credits left
          </span>
          <span className="font-medium text-foreground">{creditPct}% used</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-mint-400 transition-all"
            style={{ width: `${creditPct}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
