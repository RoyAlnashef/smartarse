"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, projects } from "@/lib/mock-data"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"

export default function UploadPage() {
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

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">Only admins can manage uploads.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Upload Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload and manage research documents across all projects
        </p>
      </div>

      {/* Upload zone */}
      <FileDropzone onUpload={() => {}} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* File list */}
      <FileList files={filtered} />
    </div>
  )
}
