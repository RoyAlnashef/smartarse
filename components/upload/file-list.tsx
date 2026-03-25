"use client"

import { FileText, FileSpreadsheet, File, MoreHorizontal, Trash2 } from "lucide-react"
import type { UploadedFile } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
}

const statusColors: Record<string, string> = {
  uploading: "bg-muted text-muted-foreground",
  ready: "bg-mint-100 text-mint-700",
  processing: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileListEmptySkeleton() {
  const rows = [0, 1, 2]
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((i) => (
            <tr key={i} className="hover:bg-transparent">
              <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-2 py-0.5">
                    <Skeleton
                      className={`h-4 max-w-[min(100%,14rem)] ${i === 0 ? "w-[85%]" : i === 1 ? "w-[72%]" : "w-[90%]"}`}
                    />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 align-middle">
                <Skeleton className="h-5 w-20 rounded-full" />
              </td>
              <td className="px-4 py-3 text-right align-middle">
                <Skeleton className="ml-auto h-7 w-7 rounded-md" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border bg-muted/20 px-4 py-2.5 text-center text-xs text-muted-foreground">
        Uploaded files will appear here.
      </p>
    </div>
  )
}

export function FileList({
  files,
  onDelete,
  isInitialLoading = false,
}: {
  files: UploadedFile[]
  onDelete?: (id: string) => void
  /** When true, show the skeleton table (e.g. first Supabase fetch in flight). */
  isInitialLoading?: boolean
}) {
  if (isInitialLoading || files.length === 0) {
    return <FileListEmptySkeleton />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {files.map((file) => {
            const Icon = fileIcons[file.type] ?? File
            const showActions =
              Boolean(onDelete) && file.status !== "uploading"
            return (
              <tr key={file.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{file.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  {file.status === "uploading" ? (
                    <div className="max-w-[10rem] space-y-1.5">
                      <Progress
                        value={file.uploadProgress ?? 0}
                        className="h-2 bg-muted [&>div]:bg-mint-500"
                      />
                      <span className="text-xs text-muted-foreground">Uploading…</span>
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[file.status] ?? statusColors.processing}`}
                    >
                      {file.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  {showActions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open actions for {file.name}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => onDelete?.(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
