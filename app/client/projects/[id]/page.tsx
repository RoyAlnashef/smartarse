"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function ClientProjectDetailPlaceholderPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { getVisibleProjects } = useAuth()
  const project = useMemo(
    () => getVisibleProjects().find((p) => p.id === id),
    [getVisibleProjects, id]
  )

  if (!project) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-arse-title text-lg font-bold text-arse-magenta">Project not found</p>
        <Link
          href="/client/projects"
          className="mt-6 inline-block font-arse-title text-sm font-bold uppercase tracking-wide text-arse-black underline decoration-arse-magenta decoration-2 underline-offset-4 hover:text-arse-magenta"
        >
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/client/projects"
        className="font-arse-body text-sm font-medium text-arse-black/70 hover:text-arse-magenta"
      >
        ← Projects
      </Link>
      <div className="mt-8 rounded-3xl border-4 border-arse-magenta bg-white p-8">
        <p className="font-arse-title text-xs font-bold uppercase tracking-widest text-arse-magenta">
          Coming next
        </p>
        <h1 className="font-arse-title mt-2 text-2xl font-bold text-arse-black">{project.name}</h1>
        <p className="mt-4 font-arse-body text-sm leading-relaxed text-arse-black/75">{project.description}</p>
        <p className="mt-8 rounded-xl border-2 border-dashed border-arse-black/20 bg-arse-cyan/30 px-4 py-6 text-center text-sm text-arse-black/60">
          Themed project detail and chat will be built in a later spec.
        </p>
      </div>
    </div>
  )
}
