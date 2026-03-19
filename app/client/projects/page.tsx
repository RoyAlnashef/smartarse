"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { ClientProjectCard } from "@/components/client/client-project-card"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export default function ClientProjectsPage() {
  const { getVisibleProjects } = useAuth()
  const [search, setSearch] = useState("")
  const projects = getVisibleProjects()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q)
    )
  }, [projects, search])

  return (
    <div className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Hero branding */}
        <div className="flex flex-col items-center text-center lg:flex-row lg:justify-center lg:gap-10 lg:text-left">
          <div className="max-w-xl">
            <h1 className="flex flex-wrap items-end justify-center gap-x-2 gap-y-1 text-4xl sm:text-5xl md:text-6xl lg:justify-start">
              <span className="font-arse-smart text-arse-pink leading-none">smart</span>
              <span className="font-arse-title font-bold tracking-[0.12em] text-arse-black">A.R.S.E</span>
            </h1>
            <p className="font-arse-title mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-arse-black sm:text-sm">
              Agentic research search engine
            </p>
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
        <div className="mx-auto mt-10 max-w-2xl">
          <label htmlFor="client-project-search" className="font-arse-title text-xs font-bold uppercase tracking-[0.2em] text-arse-black">
            Project search
          </label>
          <div className="relative mt-2">
            <input
              id="client-project-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className={cn(
                "w-full rounded-lg border-4 border-arse-black bg-arse-cyan py-3 pl-4 pr-14 font-arse-body text-sm text-arse-black placeholder:text-arse-black/45",
                "focus:outline-none focus:ring-2 focus:ring-arse-pink"
              )}
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-arse-black" strokeWidth={2.5} />
          </div>
        </div>

        {/* Projects grid + side label */}
        <div className="relative mt-14 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-10">
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
              <p className="font-arse-title text-4xl font-light uppercase tracking-wider text-arse-black">
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
            {filtered.length > 0 ? (
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
