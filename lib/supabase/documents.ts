"use client"

import type { UploadedFile } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  inferUploadedFileType,
  validateFileForUpload,
} from "@/components/upload/upload-config"
import { isCiteColorToken } from "@/lib/theme/cite-color-tokens"
import { isSourceFileIconKey } from "@/lib/theme/source-file-icons"

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
  /** Present after migration `202604131600_project_documents_display_name`. */
  display_name?: string | null
  /** Present after migration `202605031200_project_documents_cite_color_token`. */
  cite_color_token?: string | null
  /** Present after migration `202605041200_project_documents_source_icon_key`. */
  source_icon_key?: string | null
  storage_path: string
  size_bytes: number
  mime_type: string | null
  uploaded_by: string | null
  uploaded_at: string
  status: string
  sort_order: number
}

const documentSelect =
  "id,project_id,name,display_name,cite_color_token,source_icon_key,storage_path,size_bytes,mime_type,uploaded_by,uploaded_at,status,sort_order"

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
    displayName: row.display_name ?? null,
    citeColorToken: row.cite_color_token ?? null,
    sourceIconKey: row.source_icon_key ?? null,
    type: inferUploadedFileType(ext),
    size: row.size_bytes,
    projectId: row.project_id,
    uploadedBy: row.uploaded_by ?? "",
    uploadedAt: row.uploaded_at,
    status: normalizedStatus,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
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
    .order("sort_order", { ascending: true })
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
        : ext === "md" || ext === "markdown"
          ? "text/markdown"
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

  const { data: maxRow, error: maxErr } = await supabase
    .from("project_documents")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (maxErr) {
    await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove([path])
    throw formatDocumentUploadError(maxErr.message, "database")
  }

  const nextSortOrder =
    maxRow && typeof (maxRow as { sort_order: number }).sort_order === "number"
      ? (maxRow as { sort_order: number }).sort_order + 1
      : 0

  const { data, error: insertError } = await supabase
    .from("project_documents")
    .insert({
      id: documentId,
      project_id: input.projectId,
      name: input.file.name,
      storage_path: path,
      size_bytes: input.file.size,
      mime_type:
        input.file.type ||
        (ext === "md" || ext === "markdown" ? "text/markdown" : null),
      uploaded_by: uploadedByRow,
      status: "ready",
      sort_order: nextSortOrder,
    })
    .select(documentSelect)
    .single()

  if (insertError) {
    await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove([path])
    throw formatDocumentUploadError(insertError.message, "database")
  }

  return rowToUploadedFile(data as ProjectDocumentRow)
}

const DISPLAY_NAME_MAX = 500

export type DisplayNameMirrorSyncResult =
  | {
      status: "updated"
      /** Number of `record_manager_v2` rows matched by original filename. */
      matchedCount: number
    }
  | {
      status: "skipped_no_match"
      matchedCount: 0
    }
  | {
      status: "failed"
      /** Rows that matched before update attempt, when known. */
      matchedCount: number
      error: string
    }

export type UpdateProjectDocumentDisplayNameResult = {
  document: UploadedFile
  mirrorSync: DisplayNameMirrorSyncResult
}

export async function updateProjectDocumentDisplayName(
  documentId: string,
  input: { displayName: string | null }
): Promise<UpdateProjectDocumentDisplayNameResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  if (!isUuidString(documentId)) {
    throw new Error("Invalid document id.")
  }

  const raw = input.displayName
  const trimmed = typeof raw === "string" ? raw.trim() : ""
  const dbValue =
    trimmed === ""
      ? null
      : trimmed.length > DISPLAY_NAME_MAX
        ? trimmed.slice(0, DISPLAY_NAME_MAX)
        : trimmed

  const { data: currentData, error: currentError } = await supabase
    .from("project_documents")
    .select("name,display_name,project_id")
    .eq("id", documentId)
    .single()

  if (currentError) throw new Error(currentError.message)
  const currentRow = currentData as Pick<
    ProjectDocumentRow,
    "name" | "display_name" | "project_id"
  >
  const originalFilename = currentRow.name.trim()
  const previousDisplayName = currentRow.display_name?.trim()

  const { data, error } = await supabase
    .from("project_documents")
    .update({ display_name: dbValue })
    .eq("id", documentId)
    .select(documentSelect)
    .single()

  if (error) throw new Error(error.message)
  const updatedRow = data as ProjectDocumentRow
  const updatedDocument = rowToUploadedFile(updatedRow)
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("organization_id")
    .eq("id", currentRow.project_id)
    .single()

  if (projectError) {
    return {
      document: updatedDocument,
      mirrorSync: {
        status: "failed",
        matchedCount: 0,
        error: projectError.message,
      },
    }
  }

  const projectOrgId = (projectData as { organization_id: string }).organization_id

  // Try org-scoped first, then fall back without organization_id. Offline ingest rows
  // sometimes have organization_id that does not match projects.organization_id.
  const matchAttempts: Array<ReturnType<typeof supabase.from>> = [
    supabase
      .from("record_manager_v2")
      .select("id")
      .eq("organization_id", projectOrgId)
      .eq("source_filename", originalFilename),
    supabase
      .from("record_manager_v2")
      .select("id")
      .eq("organization_id", projectOrgId)
      .eq("document_title", originalFilename),
  ]
  if (previousDisplayName) {
    matchAttempts.push(
      supabase
        .from("record_manager_v2")
        .select("id")
        .eq("organization_id", projectOrgId)
        .eq("document_title", previousDisplayName)
    )
  }
  matchAttempts.push(
    supabase
      .from("record_manager_v2")
      .select("id")
      .eq("source_filename", originalFilename),
    supabase
      .from("record_manager_v2")
      .select("id")
      .eq("document_title", originalFilename)
  )
  if (previousDisplayName) {
    matchAttempts.push(
      supabase
        .from("record_manager_v2")
        .select("id")
        .eq("document_title", previousDisplayName)
    )
  }

  let matchedIds: (string | number)[] = []
  for (const q of matchAttempts) {
    const { data, error } = await q
    if (error) {
      return {
        document: updatedDocument,
        mirrorSync: {
          status: "failed",
          matchedCount: 0,
          error: error.message,
        },
      }
    }
    const rows = data ?? []
    if (rows.length > 0) {
      matchedIds = rows.map((r: { id: string | number }) => r.id)
      break
    }
  }

  const matchedCount = matchedIds.length

  if (matchedCount < 1) {
    return {
      document: updatedDocument,
      mirrorSync: {
        status: "skipped_no_match",
        matchedCount: 0,
      },
    }
  }

  const { error: mirrorUpdateError } = await supabase
    .from("record_manager_v2")
    .update({
      document_title: dbValue,
      source_filename: originalFilename,
    })
    .in("id", matchedIds)

  if (mirrorUpdateError) {
    return {
      document: updatedDocument,
      mirrorSync: {
        status: "failed",
        matchedCount,
        error: mirrorUpdateError.message,
      },
    }
  }

  return {
    document: updatedDocument,
    mirrorSync: {
      status: "updated",
      matchedCount,
    },
  }
}

export async function updateProjectDocumentCiteColor(
  documentId: string,
  input: { citeColorToken: string | null }
): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  if (!isUuidString(documentId)) {
    throw new Error("Invalid document id.")
  }

  const raw = input.citeColorToken
  const trimmed = typeof raw === "string" ? raw.trim() : ""
  if (trimmed !== "" && !isCiteColorToken(trimmed)) {
    throw new Error("Invalid source color.")
  }
  const dbValue = trimmed === "" ? null : trimmed

  const { data, error } = await supabase
    .from("project_documents")
    .update({ cite_color_token: dbValue })
    .eq("id", documentId)
    .select(documentSelect)
    .single()

  if (error) {
    const message = error.message ?? "Failed to update source color."
    if (
      message.includes("project_documents_cite_color_token_allowed") ||
      message.includes("violates check constraint")
    ) {
      throw new Error(
        "Source color shades (50-950) are not enabled in this database yet. Run migration `202605072220_expand_project_documents_cite_color_token_shades.sql`, then retry."
      )
    }
    throw new Error(message)
  }
  return rowToUploadedFile(data as ProjectDocumentRow)
}

export async function updateProjectDocumentSourceIcon(
  documentId: string,
  input: { sourceIconKey: string | null }
): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  if (!isUuidString(documentId)) {
    throw new Error("Invalid document id.")
  }

  const raw = input.sourceIconKey
  const trimmed = typeof raw === "string" ? raw.trim() : ""
  if (trimmed !== "" && !isSourceFileIconKey(trimmed)) {
    throw new Error("Invalid source icon.")
  }
  const dbValue = trimmed === "" ? null : trimmed

  const { data, error } = await supabase
    .from("project_documents")
    .update({ source_icon_key: dbValue })
    .eq("id", documentId)
    .select(documentSelect)
    .single()

  if (error) throw new Error(error.message)
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

/**
 * Persists document order for a project. `orderedIds` must list every persisted
 * document id for the project exactly once (same set as the server).
 */
export async function reorderProjectDocuments(
  projectId: string,
  orderedIds: string[]
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  if (!isUuidString(projectId)) {
    throw new Error("Invalid project id.")
  }

  for (const id of orderedIds) {
    if (!isUuidString(id)) {
      throw new Error("Invalid document id in order list.")
    }
  }

  const { error } = await supabase.rpc("reorder_project_documents", {
    p_project_id: projectId,
    p_document_ids: orderedIds,
  })

  if (error) throw new Error(error.message)
}
