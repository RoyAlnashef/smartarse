"use client"

import Link from "next/link"
import type { Project } from "@/lib/types"
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
        "group flex flex-col overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-arse-black transition-transform",
        "hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--arse-magenta)]"
      )}
    >
      <div className="bg-arse-magenta px-4 py-2 text-center font-arse-title text-xs font-bold uppercase tracking-wider text-white">
        {formatCardDate(project.createdAt)}
      </div>
      <div className="flex flex-1 flex-col bg-arse-cyan px-4 py-5 text-arse-black">
        <h2 className="font-arse-title text-sm font-bold uppercase leading-snug tracking-wide">
          {project.name}
        </h2>
        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-arse-black/90">
          Overview of project: {project.description}
        </p>
        <p className="mt-4 text-xs leading-snug text-arse-black/75">{sourceLine(project)}</p>
      </div>
    </Link>
  )
}
