"use client"

import type { Project } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  isUuidString,
  PROJECT_DOCUMENTS_BUCKET,
} from "@/lib/supabase/documents"

const STORAGE_REMOVE_CHUNK = 50

/** Row shape from `public.projects` plus embedded org (PostgREST). */
type ProjectRow = {
  id: string
  name: string
  description: string
  organization_id: string
  status: string
  used_credits: number
  created_at: string
  updated_at: string
  last_activity: string | null
  organizations:
    | { name: string; credit_balance: number | null }
    | { name: string; credit_balance: number | null }[]
    | null
}

const projectSelect = `
  id,
  name,
  description,
  organization_id,
  status,
  used_credits,
  created_at,
  updated_at,
  last_activity,
  organizations (
    name,
    credit_balance
  )
`

function normalizeOrgEmbed(
  embed: ProjectRow["organizations"]
): { name: string; credit_balance: number | null } | null {
  if (!embed) return null
  return Array.isArray(embed) ? embed[0] ?? null : embed
}

function rowToProject(
  row: ProjectRow,
  assignedUserIds: string[],
  uploadedFileIds: string[] = []
): Project {
  const org = normalizeOrgEmbed(row.organizations)
  const lastActivity = row.last_activity ?? row.updated_at ?? row.created_at
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    clientId: row.organization_id,
    clientName: org?.name ?? "",
    status: row.status === "archived" ? "archived" : "live",
    createdAt: row.created_at,
    lastActivity,
    totalCredits: org?.credit_balance ?? 0,
    usedCredits: row.used_credits,
    assignedUserIds,
    uploadedFileIds,
  }
}

async function fetchAssignedUserIdsByProject(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  projectIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (projectIds.length === 0) return map

  const { data, error } = await supabase
    .from("project_users")
    .select("project_id, user_id")
    .in("project_id", projectIds)

  if (error) throw new Error(error.message)

  for (const row of data ?? []) {
    const pid = row.project_id as string
    const uid = row.user_id as string
    const list = map.get(pid) ?? []
    list.push(uid)
    map.set(pid, list)
  }
  return map
}

async function fetchDocumentIdsByProject(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  projectIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (projectIds.length === 0) return map

  const { data, error } = await supabase
    .from("project_documents")
    .select("id, project_id")
    .in("project_id", projectIds)

  if (error) throw new Error(error.message)

  for (const row of data ?? []) {
    const pid = row.project_id as string
    const docId = row.id as string
    const list = map.get(pid) ?? []
    list.push(docId)
    map.set(pid, list)
  }
  return map
}

/**
 * Lists projects visible to the current session (RLS enforces admin / client org / user assignment).
 */
export async function listProjectsForAuthUser(): Promise<Project[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("projects")
    .select(projectSelect)
    .order("updated_at", { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as ProjectRow[]
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const [byProject, docsByProject] = await Promise.all([
    fetchAssignedUserIdsByProject(supabase, ids),
    fetchDocumentIdsByProject(supabase, ids),
  ])
  return rows.map((row) =>
    rowToProject(
      row,
      byProject.get(row.id) ?? [],
      docsByProject.get(row.id) ?? []
    )
  )
}

/**
 * Loads a single project if RLS allows (returns null if missing or denied).
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("projects")
    .select(projectSelect)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as ProjectRow
  const [{ data: puRows, error: puError }, docMap] = await Promise.all([
    supabase.from("project_users").select("user_id").eq("project_id", id),
    fetchDocumentIdsByProject(supabase, [id]),
  ])

  if (puError) throw new Error(puError.message)
  const assignedUserIds = (puRows ?? []).map((r) => r.user_id as string)

  return rowToProject(row, assignedUserIds, docMap.get(id) ?? [])
}

export async function assignProjectUser(
  projectId: string,
  userId: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(projectId) || !isUuidString(userId)) {
    throw new Error("Invalid project or user id.")
  }

  const { error } = await supabase.from("project_users").insert({
    project_id: projectId,
    user_id: userId,
  })

  if (error) {
    if (error.code === "23505") return
    throw new Error(error.message)
  }
}

export async function unassignProjectUser(
  projectId: string,
  userId: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(projectId) || !isUuidString(userId)) {
    throw new Error("Invalid project or user id.")
  }

  const { error } = await supabase
    .from("project_users")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)
}

export async function createProject(input: {
  organizationId: string
  name: string
  description?: string
  status?: Project["status"]
}): Promise<Project> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const trimmed = input.name.trim()
  if (!trimmed) throw new Error("Project name is required.")

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: input.organizationId,
      name: trimmed,
      description: (input.description ?? "").trim(),
      status: input.status ?? "live",
    })
    .select(projectSelect)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Failed to create project.")

  const row = data as ProjectRow
  return rowToProject(row, [])
}

export async function updateProject(input: {
  id: string
  name?: string
  description?: string
  status?: Project["status"]
  usedCredits?: number
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const patch: Record<string, string | number> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.description !== undefined) patch.description = input.description.trim()
  if (input.status !== undefined) patch.status = input.status
  if (input.usedCredits !== undefined) patch.used_credits = input.usedCredits

  if (Object.keys(patch).length === 0) return

  patch.updated_at = new Date().toISOString()

  const { error } = await supabase.from("projects").update(patch).eq("id", input.id)

  if (error) throw new Error(error.message)
}

/**
 * Deletes a project (admin + RLS: only when used_credits = 0).
 * Removes the DB row first, then deletes storage objects for project documents.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  if (!isUuidString(projectId)) {
    throw new Error(
      "This project id is not valid for deletion. Open a project from the dashboard list (Supabase projects use UUID ids)."
    )
  }

  const { data: creditRow, error: creditErr } = await supabase
    .from("projects")
    .select("id, used_credits")
    .eq("id", projectId)
    .maybeSingle()

  if (creditErr) throw new Error(creditErr.message)
  if (!creditRow) throw new Error("Project not found.")
  if ((creditRow as { used_credits: number }).used_credits > 0) {
    throw new Error("Cannot delete project while credits have been used on it.")
  }

  const { data: docRows, error: docErr } = await supabase
    .from("project_documents")
    .select("storage_path")
    .eq("project_id", projectId)

  if (docErr) throw new Error(docErr.message)

  const storagePaths = (docRows ?? [])
    .map((r) => (r as { storage_path: string }).storage_path)
    .filter(Boolean)

  const { data: deletedRows, error: delErr } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .select("id")

  if (delErr) throw new Error(delErr.message)
  if (!deletedRows?.length) {
    throw new Error(
      "Could not delete this project. It may no longer exist, you may not have permission, or credits may have been used on it."
    )
  }

  for (let i = 0; i < storagePaths.length; i += STORAGE_REMOVE_CHUNK) {
    const chunk = storagePaths.slice(i, i + STORAGE_REMOVE_CHUNK)
    const { error: storageErr } = await supabase.storage
      .from(PROJECT_DOCUMENTS_BUCKET)
      .remove(chunk)
    if (storageErr) {
      console.warn("Storage delete failed after project removed:", storageErr.message)
    }
  }
}
