"use client"

import { useState, useCallback } from "react"
import { Upload } from "lucide-react"
import {
  FILE_UPLOAD_ACCEPT,
  FILE_UPLOAD_TYPES_DESCRIPTION,
} from "./upload-config"

export function FileDropzone({
  onUpload,
  accept = FILE_UPLOAD_ACCEPT,
  typesDescription = FILE_UPLOAD_TYPES_DESCRIPTION,
}: {
  onUpload: (files: File[]) => void
  /** HTML `accept` attribute (e.g. `.md` for personas). Defaults to project document types. */
  accept?: string
  /** Shown under “Drop files here”; defaults to `FILE_UPLOAD_TYPES_DESCRIPTION`. */
  typesDescription?: string
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
          ? "border-arse-pink bg-arse-pink/10"
          : "border-border bg-card hover:border-arse-pink/60 hover:bg-muted"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Upload className={`h-6 w-6 ${isDragOver ? "text-arse-pink" : "text-muted-foreground"}`} />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        Drop files here
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{typesDescription}</p>
      <label className="mt-4 cursor-pointer rounded-lg bg-dark-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800">
        Choose files
        <input
          type="file"
          className="sr-only"
          multiple
          accept={accept}
          onChange={handleChange}
        />
      </label>
    </div>
  )
}
