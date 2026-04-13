"use client"

import type { Project } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  isUuidString,
  PROJECT_DOCUMENTS_BUCKET,
} from "@/lib/supabase/documents"
import { PROJECT_PERSONAS_BUCKET } from "@/lib/supabase/personas"

const STORAGE_REMOVE_CHUNK = 50

const MAX_PROJECT_CREDITS_TOP_UP = 10_000_000

function normalizeProjectStatus(raw: string): Project["status"] {
  if (raw === "live" || raw === "paused" || raw === "archived") {
    return raw
  }
  return "paused"
}

/** Row shape from `public.projects` plus embedded org (PostgREST). */
type ProjectRow = {
  id: string
  name: string
  description: string
  organization_id: string
  status: string
  used_credits: number
  credit_balance: number
  access_until: string | null
  created_at: string
  updated_at: string
  last_activity: string | null
  organizations: { name: string } | { name: string }[] | null
}

const projectSelect = `
  id,
  name,
  description,
  organization_id,
  status,
  used_credits,
  credit_balance,
  access_until,
  created_at,
  updated_at,
  last_activity,
  organizations (
    name
  )
`

function normalizeOrgEmbed(
  embed: ProjectRow["organizations"]
): { name: string } | null {
  if (!embed) return null
  return Array.isArray(embed) ? embed[0] ?? null : embed
}

function rowToProject(
  row: ProjectRow,
  assignedUserIds: string[],
  uploadedFileIds: string[] = [],
  chatCount = 0,
  /** When set, `sum(chat_results.credits_charged)` from RPC (aligned with billing). */
  usedCreditsAttributed?: number
): Project {
  const org = normalizeOrgEmbed(row.organizations)
  const lastActivity = row.last_activity ?? row.updated_at ?? row.created_at
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    clientId: row.organization_id,
    clientName: org?.name ?? "",
    status: normalizeProjectStatus(row.status),
    accessUntil: row.access_until ?? null,
    createdAt: row.created_at,
    lastActivity,
    totalCredits: row.credit_balance,
    usedCredits:
      usedCreditsAttributed !== undefined
        ? usedCreditsAttributed
        : row.used_credits,
    assignedUserIds,
    uploadedFileIds,
    chatCount,
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
    .select("id, project_id, sort_order")
    .in("project_id", projectIds)

  if (error) throw new Error(error.message)

  type DocRow = { id: string; project_id: string; sort_order: number }
  const byProject = new Map<string, DocRow[]>()
  for (const row of (data ?? []) as DocRow[]) {
    const pid = row.project_id
    const list = byProject.get(pid) ?? []
    list.push(row)
    byProject.set(pid, list)
  }
  for (const [pid, list] of byProject) {
    list.sort((a, b) => a.sort_order - b.sort_order)
    map.set(
      pid,
      list.map((r) => r.id)
    )
  }
  return map
}

async function fetchChatCountsByProject(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  projectIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (projectIds.length === 0) return map

  const { data, error } = await supabase
    .from("chat_results")
    .select("project_id")
    .in("project_id", projectIds)

  if (error) throw new Error(error.message)

  for (const row of data ?? []) {
    const pid = row.project_id as string | null
    if (pid == null) continue
    map.set(pid, (map.get(pid) ?? 0) + 1)
  }
  return map
}

/** Sum(credits_charged) per project for visible rows; matches project card / detail “spent”. */
async function fetchAttributedCreditsByProjectIds(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  projectIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  for (const id of projectIds) {
    map.set(id, 0)
  }
  if (projectIds.length === 0) return map

  const { data, error } = await supabase.rpc(
    "project_attributed_credits_by_projects",
    { p_project_ids: projectIds }
  )

  if (error) throw new Error(error.message)

  for (const row of (data ?? []) as {
    project_id: string
    credits_spent: number | string
  }[]) {
    map.set(row.project_id, Number(row.credits_spent))
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
  const [byProject, docsByProject, chatCounts, attributedSpend] =
    await Promise.all([
      fetchAssignedUserIdsByProject(supabase, ids),
      fetchDocumentIdsByProject(supabase, ids),
      fetchChatCountsByProject(supabase, ids),
      fetchAttributedCreditsByProjectIds(supabase, ids).catch(() => null),
    ])
  return rows.map((row) =>
    rowToProject(
      row,
      byProject.get(row.id) ?? [],
      docsByProject.get(row.id) ?? [],
      chatCounts.get(row.id) ?? 0,
      attributedSpend === null
        ? undefined
        : (attributedSpend.get(row.id) ?? 0)
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
  const [{ data: puRows, error: puError }, docMap, chatCounts, attributedSpend] =
    await Promise.all([
      supabase.from("project_users").select("user_id").eq("project_id", id),
      fetchDocumentIdsByProject(supabase, [id]),
      fetchChatCountsByProject(supabase, [id]),
      fetchAttributedCreditsByProjectIds(supabase, [id]).catch(() => null),
    ])

  if (puError) throw new Error(puError.message)
  const assignedUserIds = (puRows ?? []).map((r) => r.user_id as string)

  return rowToProject(
    row,
    assignedUserIds,
    docMap.get(id) ?? [],
    chatCounts.get(id) ?? 0,
    attributedSpend === null
      ? undefined
      : (attributedSpend.get(id) ?? 0)
  )
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
  accessUntil?: string | null
}): Promise<Project> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const trimmed = input.name.trim()
  if (!trimmed) throw new Error("Project name is required.")

  const insertRow: Record<string, string | null> = {
    organization_id: input.organizationId,
    name: trimmed,
    description: (input.description ?? "").trim(),
    status: input.status ?? "live",
  }
  if (input.accessUntil !== undefined) {
    insertRow.access_until = input.accessUntil
  }

  const { data, error } = await supabase.from("projects").insert(insertRow)
    .select(projectSelect)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Failed to create project.")

  const row = data as ProjectRow
  return rowToProject(row, [], [], 0)
}

export async function updateProject(input: {
  id: string
  name?: string
  description?: string
  status?: Project["status"]
  accessUntil?: string | null
  usedCredits?: number
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const patch: Record<string, string | number | null> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.description !== undefined) patch.description = input.description.trim()
  if (input.status !== undefined) patch.status = input.status
  if (input.accessUntil !== undefined) patch.access_until = input.accessUntil
  if (input.usedCredits !== undefined) patch.used_credits = input.usedCredits

  if (Object.keys(patch).length === 0) return

  patch.updated_at = new Date().toISOString()

  const { error } = await supabase.from("projects").update(patch).eq("id", input.id)

  if (error) throw new Error(error.message)
}

/**
 * Atomically increases `projects.credit_balance` (dashboard admins only; enforced in RPC).
 */
export async function addProjectCredits(
  projectId: string,
  amount: number
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(projectId)) {
    throw new Error("Invalid project id.")
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive whole number.")
  }
  if (amount > MAX_PROJECT_CREDITS_TOP_UP) {
    throw new Error(`Amount cannot exceed ${MAX_PROJECT_CREDITS_TOP_UP.toLocaleString()}.`)
  }

  const { error } = await supabase.rpc("add_project_credits", {
    p_project_id: projectId,
    p_amount: amount,
  })

  if (error) throw new Error(error.message)
}

/**
 * Atomically decreases `projects.credit_balance` (dashboard admins only; enforced in RPC).
 */
export async function removeProjectCredits(
  projectId: string,
  amount: number
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")
  if (!isUuidString(projectId)) {
    throw new Error("Invalid project id.")
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive whole number.")
  }
  if (amount > MAX_PROJECT_CREDITS_TOP_UP) {
    throw new Error(`Amount cannot exceed ${MAX_PROJECT_CREDITS_TOP_UP.toLocaleString()}.`)
  }

  const { error } = await supabase.rpc("remove_project_credits", {
    p_project_id: projectId,
    p_amount: amount,
  })

  if (error) throw new Error(error.message)
}

/**
 * Deletes a project (admin + RLS: only when used_credits = 0).
 * Removes the DB row first, then deletes storage objects for project documents and personas.
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

  const [
    { data: docRows, error: docErr },
    { data: personaRows, error: personaErr },
  ] = await Promise.all([
    supabase
      .from("project_documents")
      .select("storage_path")
      .eq("project_id", projectId),
    supabase
      .from("project_personas")
      .select("storage_path")
      .eq("project_id", projectId),
  ])

  if (docErr) throw new Error(docErr.message)
  if (personaErr) throw new Error(personaErr.message)

  const documentStoragePaths = (docRows ?? [])
    .map((r) => (r as { storage_path: string }).storage_path)
    .filter(Boolean)

  const personaStoragePaths = (personaRows ?? [])
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

  for (let i = 0; i < documentStoragePaths.length; i += STORAGE_REMOVE_CHUNK) {
    const chunk = documentStoragePaths.slice(i, i + STORAGE_REMOVE_CHUNK)
    const { error: storageErr } = await supabase.storage
      .from(PROJECT_DOCUMENTS_BUCKET)
      .remove(chunk)
    if (storageErr) {
      console.warn("Storage delete failed after project removed:", storageErr.message)
    }
  }

  for (let i = 0; i < personaStoragePaths.length; i += STORAGE_REMOVE_CHUNK) {
    const chunk = personaStoragePaths.slice(i, i + STORAGE_REMOVE_CHUNK)
    const { error: storageErr } = await supabase.storage
      .from(PROJECT_PERSONAS_BUCKET)
      .remove(chunk)
    if (storageErr) {
      console.warn(
        "Persona storage delete failed after project removed:",
        storageErr.message
      )
    }
  }
}

type CreditSpendRpcRow = { user_id: string; credits_spent: number | string }

/**
 * Per-user credits charged on this project (from `chat_results.credits_charged`).
 * Dashboard admin only (RPC).
 */
export async function fetchProjectCreditSpendByUser(
  projectId: string
): Promise<Map<string, number>> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return new Map()
  if (!isUuidString(projectId)) return new Map()

  const { data, error } = await supabase.rpc("dashboard_project_credit_spend_by_user", {
    p_project_id: projectId,
  })

  if (error) throw new Error(error.message)

  const map = new Map<string, number>()
  for (const row of (data ?? []) as CreditSpendRpcRow[]) {
    map.set(row.user_id, Number(row.credits_spent))
  }
  return map
}
