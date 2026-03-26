"use client"

import type { Project } from "@/lib/types"

export function ProjectDetailCard({ project }: { project: Project }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-dark-950 text-arse-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
      <div className="bg-arse-pink px-4 py-2 text-center font-arse-title text-xs font-bold uppercase tracking-[0.35em] text-arse-white">
        Project Detail
      </div>
      <div className="space-y-3 px-4 py-4">
        <h2 className="font-arse-title text-lg font-bold uppercase tracking-wide text-arse-white">
          {project.name}
        </h2>
        <p className="text-sm leading-relaxed text-arse-white/80">
          <span className="font-arse-title font-semibold text-arse-white">
            Overview of project:
          </span>{" "}
          {project.description}
        </p>
      </div>
    </section>
  )
}

