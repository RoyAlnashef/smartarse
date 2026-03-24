"use client"

import { useState, useMemo } from "react"
import { Plus, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { uploadedFiles, projects } from "@/lib/mock-data"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function FilesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [uploadOpen, setUploadOpen] = useState(false)

  const filtered = useMemo(() => {
    return uploadedFiles.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
      const matchProject = projectFilter === "all" || f.projectId === projectFilter
      return matchSearch && matchProject
    })
  }, [search, projectFilter])

  const projectNameById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    []
  )

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">Only admins can manage files.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and manage research documents across all projects
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-dark-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-800"
        >
          <Plus className="h-4 w-4" />
          Upload
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 max-w-sm flex-1">
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
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20 sm:w-auto"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <FileList files={filtered} projectNameById={projectNameById} />

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>
              PDF, CSV, and XLSX up to 50MB. Files are linked to projects after upload.
            </DialogDescription>
          </DialogHeader>
          <FileDropzone
            onUpload={() => {
              setUploadOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
