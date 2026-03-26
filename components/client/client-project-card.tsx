"use client"

import Link from "next/link"
import type { Project } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function formatCardDate(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function sourceLine(project: Project) {
  const n = project.uploadedFileIds.length
  if (n === 0) return "Sources: configure in dashboard"
  return `Sub detail of sources: ${n} research file${n === 1 ? "" : "s"}, quant & qual inputs`
}

export function ClientProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/client/projects/${project.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl transition-transform",
        "hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--arse-pink)]"
      )}
    >
      <div className="bg-arse-pink px-4 py-2 text-center font-arse-title text-xs font-bold uppercase tracking-wider text-white">
        {formatCardDate(project.createdAt)}
      </div>
      <div className="flex flex-1 flex-col items-center text-center bg-arse-cyan px-8 pt-8 pb-16 text-arse-black">
        <h2 className="font-arse-title text-md font-normal uppercase leading-snug tracking-wide">
          {project.name}
        </h2>
        <p className="mt-3 line-clamp-4 text-md font-bold leading-tight text-arse-black/90">
          Overview of project: {project.description}
        </p>
        <p className="mt-4 text-xs leading-snug text-arse-black/75">{sourceLine(project)}</p>
      </div>
    </Link>
  )
}

/** Placeholder layout aligned with `ClientProjectCard` (shadcn Skeleton). */
export function ClientProjectCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-3xl border border-arse-black/10"
      aria-busy
      aria-label="Loading project"
    >
      <div className="h-9 shrink-0 bg-arse-pink px-4" aria-hidden />
      <div className="flex flex-1 flex-col items-center bg-arse-cyan px-8 pt-8 pb-16">
        <Skeleton className="h-5 w-[min(100%,12rem)] bg-white/40 ring-1 ring-arse-black/10" />
        <div className="mt-3 w-full space-y-2">
          <Skeleton className="mx-auto h-4 w-full max-w-sm bg-white/40 ring-1 ring-arse-black/10" />
          <Skeleton className="mx-auto h-4 w-full max-w-[90%] bg-white/40 ring-1 ring-arse-black/10" />
          <Skeleton className="mx-auto h-4 w-full max-w-[75%] bg-white/40 ring-1 ring-arse-black/10" />
        </div>
        <Skeleton className="mt-4 h-3 w-48 bg-white/40 ring-1 ring-arse-black/10" />
      </div>
    </div>
  )
}
