"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, projects } from "@/lib/mock-data"
import { FileList } from "@/components/upload/file-list"
import { ProjectFilterCombobox } from "@/components/documents/project-filter-combobox"

export default function DocumentsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")

  const filtered = useMemo(() => {
    return uploadedFiles.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
      const matchProject = projectFilter === "all" || f.projectId === projectFilter
      return matchSearch && matchProject
    })
  }, [search, projectFilter])

  const projectNamesById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    []
  )

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">Only admins can manage documents.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage research documents across all projects
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
          />
        </div>
        <div className="shrink-0 sm:w-auto">
          <label className="sr-only" htmlFor="documents-project-combobox">
            Filter by project
          </label>
          <ProjectFilterCombobox
            projects={projects}
            value={projectFilter}
            onValueChange={setProjectFilter}
          />
        </div>
      </div>

      <FileList
        files={filtered}
        isInitialLoading={false}
        showProjectColumn
        projectNamesById={projectNamesById}
      />
    </div>
  )
}
