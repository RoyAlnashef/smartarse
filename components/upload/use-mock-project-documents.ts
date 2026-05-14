"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type { UploadedFile } from "@/lib/types"
import { inferUploadedFileType, validateFileForUpload } from "./upload-config"

type Handles = {
  intervalId?: ReturnType<typeof setInterval>
  timeoutIds: ReturnType<typeof setTimeout>[]
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ""
}

export function useMockProjectDocuments({
  projectId,
  uploadedBy,
}: {
  projectId: string
  uploadedBy: string
}) {
  const [localFiles, setLocalFiles] = useState<UploadedFile[]>([])
  const handlesRef = useRef<Map<string, Handles>>(new Map())

  const clearHandles = useCallback((id: string) => {
    const h = handlesRef.current.get(id)
    if (!h) return
    if (h.intervalId !== undefined) clearInterval(h.intervalId)
    for (const t of h.timeoutIds) clearTimeout(t)
    handlesRef.current.delete(id)
  }, [])

  useEffect(() => {
    const map = handlesRef.current
    return () => {
      for (const id of [...map.keys()]) {
        clearHandles(id)
      }
    }
  }, [clearHandles])

  const removeFile = useCallback(
    (id: string) => {
      clearHandles(id)
      setLocalFiles((prev) => prev.filter((f) => f.id !== id))
    },
    [clearHandles]
  )

  const addFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        const validationError = validateFileForUpload(file)
        if (validationError) {
          toast.error(validationError)
          continue
        }

        const ext = fileExtension(file.name)
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

        const doc: UploadedFile = {
          id,
          name: file.name,
          type: inferUploadedFileType(ext),
          size: file.size,
          projectId,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
          status: "uploading",
          sortOrder: 0,
          uploadProgress: 0,
        }

        setLocalFiles((prev) => [doc, ...prev])

        const handles: Handles = { timeoutIds: [] }
        handlesRef.current.set(id, handles)

        const mockFail = Math.random() < 0.06

        handles.intervalId = setInterval(() => {
          setLocalFiles((prev) =>
            prev.map((f) => {
              if (f.id !== id || f.status !== "uploading") return f
              const next = Math.min(100, (f.uploadProgress ?? 0) + 12)
              return { ...f, uploadProgress: next }
            })
          )
        }, 100)

        const uploadMs = 700 + Math.random() * 500
        const finishT = setTimeout(() => {
          const h = handlesRef.current.get(id)
          if (h?.intervalId !== undefined) {
            clearInterval(h.intervalId)
            h.intervalId = undefined
          }

          if (mockFail) {
            setLocalFiles((prev) =>
              prev.map((f) =>
                f.id === id
                  ? { ...f, status: "error", uploadProgress: undefined }
                  : f
              )
            )
            toast.error(`${file.name} failed to upload (mock). Try again.`)
            handlesRef.current.delete(id)
            return
          }

          setLocalFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, status: "processing", uploadProgress: 100 }
                : f
            )
          )

          const readyT = setTimeout(() => {
            setLocalFiles((prev) =>
              prev.map((f) =>
                f.id === id && f.status === "processing"
                  ? { ...f, status: "ready", uploadProgress: undefined }
                  : f
              )
            )
            handlesRef.current.delete(id)
          }, 900 + Math.random() * 700)

          if (h) {
            h.timeoutIds = [readyT]
          }
        }, uploadMs)

        handles.timeoutIds.push(finishT)
      }
    },
    [projectId, uploadedBy]
  )

  const localIds = useMemo(
    () => new Set(localFiles.map((f) => f.id)),
    [localFiles],
  )

  return { localFiles, addFiles, removeFile, localIds }
}
