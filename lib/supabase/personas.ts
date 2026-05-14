"use client"

import type { UploadedFile } from "@/lib/types"
import { validatePersonaFileForUpload } from "@/components/upload/persona-upload-config"
import { inferUploadedFileType } from "@/components/upload/upload-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isUuidString } from "@/lib/supabase/documents"
import { isCanonicalSegmentId } from "@/lib/personas/canonical-segments"
import { isCiteColorToken } from "@/lib/theme/cite-color-tokens"

export const PROJECT_PERSONAS_BUCKET = "project-personas"

const DISPLAY_NAME_MAX = 500
const SEGMENT_DESCRIPTION_MAX = 2000

function formatPersonaUploadError(raw: string, phase: "storage" | "database"): Error {
  const lower = raw.toLowerCase()
  if (
    lower.includes("row-level security") ||
    lower.includes("policy")
  ) {
    const where =
      phase === "storage"
        ? "Storage rejected the upload"
        : "The persona record was not saved"
    return new Error(
      `${where} (RLS). Ensure public.users has a row where id matches your Supabase Auth user id and role is admin. Apply migration 202603261500_is_dashboard_admin_role_normalize.sql if role casing was the issue.`
    )
  }
  return new Error(raw)
}

function formatPersonaConstraintError(message: string): Error {
  if (
    message.includes("project_personas_project_canonical_segment_unique") ||
    message.includes("duplicate key value violates unique constraint")
  ) {
    return new Error(
      "Another persona file is already assigned to that segment. Clear it on the other row first, or pick a different segment."
    )
  }
  return new Error(message)
}

type ProjectPersonaRow = {
  id: string
  project_id: string
  name: string
  canonical_segment_id: string | null
  display_name: string | null
  segment_description: string | null
  segment_color_token: string | null
  storage_path: string
  size_bytes: number
  mime_type: string | null
  uploaded_by: string | null
  uploaded_at: string
  status: string
  sort_order: number
}

const personaSelect =
  "id,project_id,name,display_name,canonical_segment_id,segment_description,segment_color_token,storage_path,size_bytes,mime_type,uploaded_by,uploaded_at,status,sort_order"

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ""
}

function sanitizeStorageFileName(name: string): string {
  const base = name.replace(/[/\\]/g, "-").replace(/^\.+/, "").trim()
  return base.slice(0, 200) || "file"
}

function rowToUploadedFile(row: ProjectPersonaRow): UploadedFile {
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
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    displayName: row.display_name ?? null,
    canonicalSegmentId: row.canonical_segment_id ?? null,
    segmentDescription: row.segment_description ?? null,
    segmentColorToken: row.segment_color_token ?? null,
  }
}

export async function listProjectPersonas(
  projectId: string
): Promise<UploadedFile[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  if (!isUuidString(projectId)) return []

  const { data, error } = await supabase
    .from("project_personas")
    .select(personaSelect)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("uploaded_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToUploadedFile(r as ProjectPersonaRow))
}

export async function uploadProjectPersona(input: {
  projectId: string
  file: File
  uploadedBy?: string
}): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  if (!isUuidString(input.projectId)) {
    throw new Error(
      "This project id is not valid for uploads. Open a project from the dashboard list (Supabase projects use UUID ids)."
    )
  }

  const validationError = validatePersonaFileForUpload(input.file)
  if (validationError) throw new Error(validationError)

  const personaId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `persona-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  if (!isUuidString(personaId)) {
    throw new Error("Could not generate a valid persona id for upload.")
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
  const path = `${input.projectId}/${personaId}/${safeName}`

  const ext = fileExtension(input.file.name)
  const contentType =
    input.file.type ||
    (ext === "md" || ext === "markdown" ? "text/markdown" : "text/plain")

  const { error: uploadError } = await supabase.storage
    .from(PROJECT_PERSONAS_BUCKET)
    .upload(path, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    })

  if (uploadError) {
    throw formatPersonaUploadError(uploadError.message, "storage")
  }

  const { data: maxRow, error: maxErr } = await supabase
    .from("project_personas")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (maxErr) {
    await supabase.storage.from(PROJECT_PERSONAS_BUCKET).remove([path])
    throw formatPersonaUploadError(maxErr.message, "database")
  }

  const nextSortOrder =
    maxRow && typeof (maxRow as { sort_order: number }).sort_order === "number"
      ? (maxRow as { sort_order: number }).sort_order + 1
      : 0

  const { data, error: insertError } = await supabase
    .from("project_personas")
    .insert({
      id: personaId,
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
    .select(personaSelect)
    .single()

  if (insertError) {
    await supabase.storage.from(PROJECT_PERSONAS_BUCKET).remove([path])
    throw formatPersonaUploadError(insertError.message, "database")
  }

  return rowToUploadedFile(data as ProjectPersonaRow)
}

export async function updateProjectPersonaDisplayName(
  personaId: string,
  input: { displayName: string | null }
): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(personaId)) throw new Error("Invalid persona id.")

  const trimmed = typeof input.displayName === "string" ? input.displayName.trim() : ""
  const dbValue =
    trimmed === ""
      ? null
      : trimmed.length > DISPLAY_NAME_MAX
        ? trimmed.slice(0, DISPLAY_NAME_MAX)
        : trimmed

  const { data, error } = await supabase
    .from("project_personas")
    .update({ display_name: dbValue })
    .eq("id", personaId)
    .select(personaSelect)
    .single()

  if (error) throw formatPersonaConstraintError(error.message)
  return rowToUploadedFile(data as ProjectPersonaRow)
}

export async function updateProjectPersonaSegmentColor(
  personaId: string,
  input: { segmentColorToken: string | null }
): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(personaId)) throw new Error("Invalid persona id.")

  const trimmed = typeof input.segmentColorToken === "string" ? input.segmentColorToken.trim() : ""
  if (trimmed !== "" && !isCiteColorToken(trimmed)) {
    throw new Error("Invalid segment color.")
  }
  const dbValue = trimmed === "" ? null : trimmed

  const { data, error } = await supabase
    .from("project_personas")
    .update({ segment_color_token: dbValue })
    .eq("id", personaId)
    .select(personaSelect)
    .single()

  if (error) {
    const message = error.message ?? "Failed to update segment color."
    if (
      message.includes("project_personas_segment_color_token_allowed") ||
      message.includes("violates check constraint")
    ) {
      throw new Error(
        "Segment color shades are not enabled in this database yet. Run the latest migrations, then retry."
      )
    }
    throw formatPersonaConstraintError(message)
  }
  return rowToUploadedFile(data as ProjectPersonaRow)
}

export async function updateProjectPersonaSegmentDescription(
  personaId: string,
  input: { segmentDescription: string | null }
): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(personaId)) throw new Error("Invalid persona id.")

  const trimmed =
    typeof input.segmentDescription === "string" ? input.segmentDescription.trim() : ""
  const dbValue =
    trimmed === ""
      ? null
      : trimmed.length > SEGMENT_DESCRIPTION_MAX
        ? trimmed.slice(0, SEGMENT_DESCRIPTION_MAX)
        : trimmed

  const { data, error } = await supabase
    .from("project_personas")
    .update({ segment_description: dbValue })
    .eq("id", personaId)
    .select(personaSelect)
    .single()

  if (error) throw formatPersonaConstraintError(error.message)
  return rowToUploadedFile(data as ProjectPersonaRow)
}

export async function updateProjectPersonaCanonicalSegment(
  personaId: string,
  input: { canonicalSegmentId: string | null }
): Promise<UploadedFile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(personaId)) throw new Error("Invalid persona id.")

  const raw = input.canonicalSegmentId
  const trimmed = typeof raw === "string" ? raw.trim() : ""
  const dbValue = trimmed === "" ? null : trimmed
  if (dbValue !== null && !isCanonicalSegmentId(dbValue)) {
    throw new Error("Invalid study segment.")
  }

  const { data, error } = await supabase
    .from("project_personas")
    .update({ canonical_segment_id: dbValue })
    .eq("id", personaId)
    .select(personaSelect)
    .single()

  if (error) throw formatPersonaConstraintError(error.message)
  return rowToUploadedFile(data as ProjectPersonaRow)
}

export async function deleteProjectPersona(personaId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const { data: row, error: fetchError } = await supabase
    .from("project_personas")
    .select("storage_path")
    .eq("id", personaId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!row) throw new Error("Persona not found.")

  const storagePath = (row as { storage_path: string }).storage_path

  const { error: delDbError } = await supabase
    .from("project_personas")
    .delete()
    .eq("id", personaId)

  if (delDbError) throw new Error(delDbError.message)

  const { error: storageErr } = await supabase.storage
    .from(PROJECT_PERSONAS_BUCKET)
    .remove([storagePath])

  if (storageErr) {
    console.warn("Storage delete failed after DB row removed:", storageErr.message)
  }
}

export async function reorderProjectPersonas(
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
      throw new Error("Invalid persona id in order list.")
    }
  }

  const { error } = await supabase.rpc("reorder_project_personas", {
    p_project_id: projectId,
    p_persona_ids: orderedIds,
  })

  if (error) throw new Error(error.message)
}
