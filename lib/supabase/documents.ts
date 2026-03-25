"use client"

import type { UploadedFile } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  inferUploadedFileType,
  validateFileForUpload,
} from "@/components/upload/upload-config"

export const PROJECT_DOCUMENTS_BUCKET = "project-documents"

function formatDocumentUploadError(raw: string, phase: "storage" | "database"): Error {
  const lower = raw.toLowerCase()
  if (
    lower.includes("row-level security") ||
    lower.includes("policy")
  ) {
    const where =
      phase === "storage"
        ? "Storage rejected the upload"
        : "The document record was not saved"
    return new Error(
      `${where} (RLS). Ensure public.users has a row where id matches your Supabase Auth user id and role is admin. Apply migration 202603261500_is_dashboard_admin_role_normalize.sql if role casing was the issue.`
    )
  }
  return new Error(raw)
}

type ProjectDocumentRow = {
  id: string
  project_id: string
  name: string
  storage_path: string
  size_bytes: number
  mime_type: string | null
  uploaded_by: string | null
  uploaded_at: string
  status: string
}

const documentSelect =
  "id,project_id,name,storage_path,size_bytes,mime_type,uploaded_by,uploaded_at,status"

/** Eight hyphenated hex groups — rejects mock ids like `u1`. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuidString(value: string): boolean {
  return UUID_REGEX.test(value.trim())
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ""
}

function sanitizeStorageFileName(name: string): string {
  const base = name.replace(/[/\\]/g, "-").replace(/^\.+/, "").trim()
  return base.slice(0, 200) || "file"
}

function rowToUploadedFile(row: ProjectDocumentRow): UploadedFile {
  const ext = fileExtension(row.name)
  const status = row.status
  const normalizedStatus: UploadedFile["status"] =
    status === "processing" || status === "error"
      ? status
      : "ready"

  return {
    id: row.id,
    name: row.name,
    type: inferUploadedFileType(ext),
    size: row.size_bytes,
    projectId: row.project_id,
    uploadedBy: row.uploaded_by ?? "",
    uploadedAt: row.uploaded_at,
    status: normalizedStatus,
  }
}

export async function listProjectDocuments(
  projectId: string
): Promise<UploadedFile[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  if (!isUuidString(projectId)) return []

  const { data, error } = await supabase
    .from("project_documents")
    .select(documentSelect)
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToUploadedFile(r as ProjectDocumentRow))
}

export async function uploadProjectDocument(input: {
  projectId: string
  file: File
  /** Ignored for the DB row when session has a valid auth user id (avoids mock ids like `u1`). */
  uploadedBy?: string
}): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  if (!isUuidString(input.projectId)) {
    throw new Error(
      "This project id is not valid for uploads. Open a project from the dashboard list (Supabase projects use UUID ids)."
    )
  }

  const validationError = validateFileForUpload(input.file)
  if (validationError) throw new Error(validationError)

  const documentId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  if (!isUuidString(documentId)) {
    throw new Error("Could not generate a valid document id for upload.")
  }

  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr) throw new Error(authErr.message)

  const authId = authUser?.id
  const uploadedByRow =
    authId && isUuidString(authId)
      ? authId
      : input.uploadedBy && isUuidString(input.uploadedBy)
        ? input.uploadedBy
        : null

  const safeName = sanitizeStorageFileName(input.file.name)
  const path = `${input.projectId}/${documentId}/${safeName}`

  const ext = fileExtension(input.file.name)
  const contentType =
    input.file.type ||
    (ext === "csv"
      ? "text/csv"
      : ext === "pdf"
        ? "application/pdf"
        : undefined)

  const { error: uploadError } = await supabase.storage
    .from(PROJECT_DOCUMENTS_BUCKET)
    .upload(path, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    })

  if (uploadError) {
    throw formatDocumentUploadError(uploadError.message, "storage")
  }

  const { data, error: insertError } = await supabase
    .from("project_documents")
    .insert({
      id: documentId,
      project_id: input.projectId,
      name: input.file.name,
      storage_path: path,
      size_bytes: input.file.size,
      mime_type: input.file.type || null,
      uploaded_by: uploadedByRow,
      status: "ready",
    })
    .select(documentSelect)
    .single()

  if (insertError) {
    await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove([path])
    throw formatDocumentUploadError(insertError.message, "database")
  }

  return rowToUploadedFile(data as ProjectDocumentRow)
}

export async function deleteProjectDocument(documentId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const { data: row, error: fetchError } = await supabase
    .from("project_documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!row) throw new Error("Document not found.")

  const storagePath = (row as { storage_path: string }).storage_path

  const { error: delDbError } = await supabase
    .from("project_documents")
    .delete()
    .eq("id", documentId)

  if (delDbError) throw new Error(delDbError.message)

  const { error: storageErr } = await supabase.storage
    .from(PROJECT_DOCUMENTS_BUCKET)
    .remove([storagePath])

  if (storageErr) {
    console.warn("Storage delete failed after DB row removed:", storageErr.message)
  }
}
