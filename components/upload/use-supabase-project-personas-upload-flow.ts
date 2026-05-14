"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type { UploadedFile } from "@/lib/types"
import { uploadProjectPersona } from "@/lib/supabase/personas"
import { inferUploadedFileType } from "./upload-config"
import { validatePersonaFileForUpload } from "./persona-upload-config"

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ""
}

const PENDING_PREFIX = "pending-"

/**
 * In-flight persona uploads (progress + processing → ready) merged ahead of server list.
 */
export function useSupabaseProjectPersonasUploadFlow({
  projectId,
  remotePersonas,
  setRemotePersonas,
}: {
  projectId: string
  remotePersonas: UploadedFile[] | undefined
  setRemotePersonas: React.Dispatch<
    React.SetStateAction<UploadedFile[] | undefined>
  >
}) {
  const [queue, setQueue] = useState<UploadedFile[]>([])
  const abortedIdsRef = useRef<Set<string>>(new Set())
  const progressIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map()
  )
  const processingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  )

  const clearProgressInterval = useCallback((tempId: string) => {
    const t = progressIntervalsRef.current.get(tempId)
    if (t) {
      clearInterval(t)
      progressIntervalsRef.current.delete(tempId)
    }
  }, [])

  const clearProcessingTimeout = useCallback((personaId: string) => {
    const t = processingTimeoutsRef.current.get(personaId)
    if (t) {
      clearTimeout(t)
      processingTimeoutsRef.current.delete(personaId)
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const id of progressIntervalsRef.current.keys()) {
        clearProgressInterval(id)
      }
      for (const id of processingTimeoutsRef.current.keys()) {
        clearProcessingTimeout(id)
      }
    }
  }, [clearProgressInterval, clearProcessingTimeout])

  const removePendingRow = useCallback((tempId: string) => {
    abortedIdsRef.current.add(tempId)
    clearProgressInterval(tempId)
    setQueue((q) => q.filter((f) => f.id !== tempId))
  }, [clearProgressInterval])

  const dismissOrAbort = useCallback(
    (id: string): boolean => {
      if (!id.startsWith(PENDING_PREFIX)) return false
      removePendingRow(id)
      return true
    },
    [removePendingRow]
  )

  const uploadSingle = useCallback(
    async (file: File) => {
      const validationError = validatePersonaFileForUpload(file)
      if (validationError) {
        toast.error(validationError)
        return
      }

      const tempId = `${PENDING_PREFIX}${crypto.randomUUID()}`
      const ext = fileExtension(file.name)
      const queued: UploadedFile = {
        id: tempId,
        name: file.name,
        type: inferUploadedFileType(ext),
        size: file.size,
        projectId,
        uploadedBy: "",
        uploadedAt: new Date().toISOString(),
        status: "uploading",
        sortOrder: 0,
        uploadProgress: 0,
      }

      abortedIdsRef.current.delete(tempId)
      setQueue((q) => [queued, ...q])

      const tick = setInterval(() => {
        setQueue((prev) =>
          prev.map((f) => {
            if (f.id !== tempId || f.status !== "uploading") return f
            return {
              ...f,
              uploadProgress: Math.min(92, (f.uploadProgress ?? 0) + 7),
            }
          })
        )
      }, 110)
      progressIntervalsRef.current.set(tempId, tick)

      try {
        const saved = await uploadProjectPersona({
          projectId,
          file,
        })
        clearProgressInterval(tempId)
        if (abortedIdsRef.current.has(tempId)) {
          abortedIdsRef.current.delete(tempId)
          return
        }

        setQueue((q) => q.filter((f) => f.id !== tempId))

        const processingRow: UploadedFile = {
          ...saved,
          status: "processing",
          uploadProgress: undefined,
        }
        setRemotePersonas((prev) => {
          const base = prev ?? []
          const withoutDup = base.filter((f) => f.id !== saved.id)
          return [processingRow, ...withoutDup]
        })

        const t = setTimeout(() => {
          processingTimeoutsRef.current.delete(saved.id)
          setRemotePersonas((prev) =>
            (prev ?? []).map((f) =>
              f.id === saved.id ? { ...f, status: "ready" as const } : f
            )
          )
        }, 950 + Math.random() * 400)
        processingTimeoutsRef.current.set(saved.id, t)
      } catch (err: unknown) {
        clearProgressInterval(tempId)
        if (abortedIdsRef.current.has(tempId)) {
          abortedIdsRef.current.delete(tempId)
          return
        }
        setQueue((prev) =>
          prev.map((f) =>
            f.id === tempId
              ? {
                  ...f,
                  status: "error",
                  uploadProgress: undefined,
                }
              : f
          )
        )
        toast.error(err instanceof Error ? err.message : "Upload failed")
      }
    },
    [projectId, clearProgressInterval, setRemotePersonas]
  )

  const uploadFiles = useCallback(
    async (files: File[]) => {
      await Promise.all(files.map((file) => uploadSingle(file)))
    },
    [uploadSingle]
  )

  useEffect(() => {
    setQueue([])
    abortedIdsRef.current.clear()
    for (const tid of [...progressIntervalsRef.current.keys()]) {
      clearProgressInterval(tid)
    }
    for (const tid of [...processingTimeoutsRef.current.keys()]) {
      clearProcessingTimeout(tid)
    }
  }, [projectId, clearProgressInterval, clearProcessingTimeout])

  const mergedPersonas = useMemo(
    () => [...queue, ...(remotePersonas ?? [])],
    [queue, remotePersonas]
  )

  return {
    mergedPersonas,
    uploadFiles,
    dismissPendingUpload: dismissOrAbort,
    pendingCount: queue.length,
  }
}
