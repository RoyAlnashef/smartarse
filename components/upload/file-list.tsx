"use client"

import { FileText, FileSpreadsheet, File, Trash2 } from "lucide-react"
import type { UploadedFile } from "@/lib/types"

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
}

const statusColors: Record<string, string> = {
  ready: "bg-mint-100 text-mint-700",
  processing: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function FileList({
  files,
  projectNameById,
}: {
  files: UploadedFile[]
  /** Map of project id → display name; used for the Project column */
  projectNameById?: Record<string, string>
}) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
        <FileText className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-foreground">No files uploaded</p>
        <p className="text-sm text-muted-foreground">Upload research documents to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">
              Project
            </th>
            <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">Size</th>
            <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Uploaded</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {files.map((file) => {
            const Icon = fileIcons[file.type] ?? File
            const projectLabel =
              projectNameById?.[file.projectId] ?? file.projectId
            return (
              <tr key={file.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">{file.name}</span>
                  </div>
                </td>
                <td className="hidden max-w-[12rem] truncate px-4 py-3 text-muted-foreground sm:table-cell">
                  {projectLabel}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {formatSize(file.size)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {formatDate(file.uploadedAt)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[file.status]}`}>
                    {file.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete {file.name}</span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
