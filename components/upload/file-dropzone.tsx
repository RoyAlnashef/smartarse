"use client"

import { useState, useCallback } from "react"
import { Upload, FileText } from "lucide-react"

export function FileDropzone({
  onUpload,
}: {
  onUpload: (files: File[]) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) onUpload(files)
    },
    [onUpload]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) onUpload(files)
    },
    [onUpload]
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        isDragOver
          ? "border-mint-400 bg-mint-50"
          : "border-border bg-card hover:border-mint-300 hover:bg-muted"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Upload className={`h-6 w-6 ${isDragOver ? "text-mint-500" : "text-muted-foreground"}`} />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        Drop files here or click to upload
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, CSV, and XLSX files up to 50MB
      </p>
      <label className="mt-4 cursor-pointer rounded-lg bg-dark-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800">
        Choose files
        <input
          type="file"
          className="sr-only"
          multiple
          accept=".pdf,.csv,.xlsx"
          onChange={handleChange}
        />
      </label>
    </div>
  )
}
