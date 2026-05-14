"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { ProjectCard, ProjectCardSkeleton } from "@/components/dashboard/project-card"
import { ProjectCreateDialog } from "@/components/dashboard/project-create-dialog"
import { ProjectFilters } from "@/components/dashboard/project-filters"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { listProjectsForAuthUser } from "@/lib/supabase/projects"
import type { Project } from "@/lib/types"

const SKELETON_CARD_COUNT = 6

export function ProjectsWorkspace() {
  const { user, getVisibleProjects } = useAuth()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(
    null,
  )
  const [createOpen, setCreateOpen] = useState(false)

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

  const organizations = useMemo(() => {
    const names = [...new Set(allProjects.map((p) => p.clientName))]
    return names.sort((a, b) => a.localeCompare(b))
  }, [allProjects])

  const filtered = useMemo(() => {
    return allProjects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === "all" || p.status === status
      const matchOrganization =
        organizationFilter === null || p.clientName === organizationFilter
      return matchSearch && matchStatus && matchOrganization
    })
  }, [allProjects, search, status, organizationFilter])

  if (!user) return null

  const supabaseConfigured = !!getSupabaseBrowserClient()

  function openCreateDialog() {
    if (!supabaseConfigured) {
      toast.info("Connect Supabase to create projects.")
      return
    }
    setCreateOpen(true)
  }

  const isEmptyLibrary = allProjects.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "admin"
              ? "Manage all organization projects and research data"
              : "View and interact with your research projects"}
          </p>
        </div>
        {user.role === "admin" && (
          <button
            type="button"
            onClick={openCreateDialog}
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
        organizations={organizations}
        organizationFilter={organizationFilter}
        onOrganizationFilterChange={setOrganizationFilter}
      />

      {loadingRemote ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16">
          {isEmptyLibrary ? (
            <>
              <p className="text-sm font-medium text-foreground">
                {user.role === "admin"
                  ? "No projects yet"
                  : "No projects to show"}
              </p>
              <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                {user.role === "admin"
                  ? "Get started by creating your first project."
                  : "Projects you have access to will appear here."}
              </p>
              {user.role === "admin" && (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-dark-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Project
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                No projects match your filters
              </p>
              <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
              {user.role === "admin" && (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-dark-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Project
                </button>
              )}
            </>
          )}
        </div>
      )}

      {user.role === "admin" && supabaseConfigured && (
        <ProjectCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => void loadRemoteProjects()}
        />
      )}
    </div>
  )
}
