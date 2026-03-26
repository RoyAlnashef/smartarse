"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import {
  ClientProjectCard,
  ClientProjectCardSkeleton,
} from "@/components/client/client-project-card"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { listProjectsForAuthUser } from "@/lib/supabase/projects"
import type { Project } from "@/lib/types"
import { ArseLogoGroup } from "@/components/arse-logo-group"
import { cn } from "@/lib/utils"

const SKELETON_CARD_COUNT = 3

export default function ClientProjectsPage() {
  const { user, getVisibleProjects } = useAuth()
  const [search, setSearch] = useState("")

  const useRemoteProjects = !!getSupabaseBrowserClient() && !!user
  const [remoteProjects, setRemoteProjects] = useState<Project[] | null>(null)

  const loadRemoteProjects = useCallback(async () => {
    if (!getSupabaseBrowserClient() || !user) return
    setRemoteProjects(null)
    try {
      const rows = await listProjectsForAuthUser()
      setRemoteProjects(rows)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load projects"
      toast.error(message)
      setRemoteProjects([])
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (!useRemoteProjects) {
      setRemoteProjects(null)
      return
    }
    void loadRemoteProjects()
  }, [useRemoteProjects, loadRemoteProjects, user?.id, user?.role])

  const loadingRemote = useRemoteProjects && remoteProjects === null

  const allProjects = useMemo(() => {
    if (!useRemoteProjects) return getVisibleProjects()
    return remoteProjects ?? []
  }, [useRemoteProjects, remoteProjects, getVisibleProjects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allProjects
    return allProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q)
    )
  }, [allProjects, search])

  return (
    <div className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Hero branding */}
        <div className="flex flex-col items-center text-center lg:flex-row lg:justify-center lg:gap-10 lg:text-left">
          <div className="max-w-xl">
            <ArseLogoGroup className="flex w-max max-w-full flex-col items-stretch gap-0" />
          </div>
          <div
            className="mt-6 hidden h-36 w-36 shrink-0 lg:flex lg:items-center lg:justify-center"
            aria-hidden
            title="Robot illustration placeholder"
          >
            <img
              src="/robot.png"
              alt=""
              aria-hidden
              draggable={false}
              className="h-[132px] w-auto translate-y-[-2px]"
            />
          </div>
        </div>

        {/* Search */}
        <div className="mx-auto mt-12 sm:mt-0 max-w-[480px]">
          <label htmlFor="client-project-search" className="sr-only">
            Project search
          </label>
          <div className="relative">
            <input
              id="client-project-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className={cn(
                "w-full rounded-lg border-4 border-arse-black bg-arse-cyan py-3 pl-4 pr-14 font-arse-body text-sm text-arse-black placeholder:text-arse-black placeholder:opacity-100",
                "focus:outline-none focus:ring-2 focus:ring-arse-pink"
              )}
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-arse-black" strokeWidth={2.5} />
          </div>
        </div>

        {/* Projects grid + side label */}
        <div className="relative mt-12 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-10">
          <aside className="relative hidden lg:block lg:col-span-1">
            <div
              className="absolute -left-4 top-8 h-40 w-40 rounded-full opacity-40"
              style={{
                background: "radial-gradient(circle, var(--arse-cyan) 1.5px, transparent 1.5px)",
                backgroundSize: "10px 10px",
              }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-2 items-end text-right">
              <p className="font-arse-title text-3xl sm:text-4xl font-light uppercase tracking-wider text-arse-black">
                Projects
              </p>
              <p className="mt-1 max-w-[10rem] text-sm font-bold leading-snug text-arse-black">
                Space for secondary copy if needed.
              </p>
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-3">
            <p className="mb-6 font-arse-title text-2xl font-light uppercase tracking-[0.2em] text-arse-black lg:hidden">
              Projects
            </p>
            {loadingRemote ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
                  <ClientProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : allProjects.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-arse-black/20 bg-arse-cyan/20 px-6 py-16 text-center">
                <p className="font-arse-title font-semibold text-arse-black">No projects yet</p>
                <p className="mt-2 text-sm text-arse-black/60">
                  When your organization has projects, they will appear here.
                </p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((project) => (
                  <ClientProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-arse-black/20 bg-arse-cyan/20 px-6 py-16 text-center">
                <p className="font-arse-title font-semibold text-arse-black">No projects match</p>
                <p className="mt-2 text-sm text-arse-black/60">Try another search term.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
