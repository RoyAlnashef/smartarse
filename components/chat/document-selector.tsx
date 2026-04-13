"use client"

import { FileText, FileSpreadsheet, File } from "lucide-react"
import type { UploadedFile } from "@/lib/types"
import { sourceListLabel } from "@/lib/documents/display-label"

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  md: FileText,
}

export function DocumentSelector({
  files,
  selected,
  onToggle,
  disabled = false,
}: {
  files: UploadedFile[]
  selected: Set<string>
  onToggle: (id: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </h3>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {files.map((file) => {
          const Icon = fileIcons[file.type] ?? File
          const isSelected = selected.has(file.id)
          const label = sourceListLabel(file)
          const hasCustomDisplay = Boolean(file.displayName?.trim())
          return (
            <button
              key={file.id}
              onClick={() => onToggle(file.id)}
              disabled={disabled || file.status !== "ready"}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                isSelected
                  ? "bg-arse-cyan/10 ring-1 ring-arse-cyan/40"
                  : "hover:bg-muted"
              } ${disabled || file.status !== "ready" ? "opacity-50" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? "bg-arse-cyan/15" : "bg-muted"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isSelected ? "text-arse-cyan" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {label}
                </p>
                {hasCustomDisplay ? (
                  <p className="truncate text-xs text-muted-foreground" title={file.name}>
                    {file.name}
                  </p>
                ) : null}
                {file.status !== "ready" && (
                  <p className="text-xs text-amber-500">({file.status})</p>
                )}
              </div>
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  isSelected
                    ? "border-arse-pink bg-arse-pink"
                    : "border-border bg-card"
                }`}
              >
                {isSelected && (
                  <svg className="h-3 w-3 text-arse-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
