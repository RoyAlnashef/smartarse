"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProjectCard } from "@/components/dashboard/project-card"
import { ProjectFilters } from "@/components/dashboard/project-filters"

export function ProjectsWorkspace() {
  const { user, getVisibleProjects } = useAuth()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [clientFilter, setClientFilter] = useState<string | null>(null)

  const allProjects = getVisibleProjects()

  const clients = useMemo(() => {
    const names = [...new Set(allProjects.map((p) => p.clientName))]
    return names.sort((a, b) => a.localeCompare(b))
  }, [allProjects])

  const filtered = useMemo(() => {
    return allProjects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === "all" || p.status === status
      const matchClient =
        clientFilter === null || p.clientName === clientFilter
      return matchSearch && matchStatus && matchClient
    })
  }, [allProjects, search, status, clientFilter])

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "admin"
              ? "Manage all client projects and research data"
              : "View and interact with your research projects"}
          </p>
        </div>
        {user.role === "admin" && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-dark-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-800"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        )}
      </div>

      <ProjectFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        clients={clients}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
      />

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-sm font-medium text-foreground">No projects found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}
