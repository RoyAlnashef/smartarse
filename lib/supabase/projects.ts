"use client"

import type { Project } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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

function rowToProject(row: ProjectRow, assignedUserIds: string[]): Project {
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
    uploadedFileIds: [],
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

  const byProject = await fetchAssignedUserIdsByProject(
    supabase,
    rows.map((r) => r.id)
  )
  return rows.map((row) => rowToProject(row, byProject.get(row.id) ?? []))
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
  const { data: puRows, error: puError } = await supabase
    .from("project_users")
    .select("user_id")
    .eq("project_id", id)

  if (puError) throw new Error(puError.message)
  const assignedUserIds = (puRows ?? []).map((r) => r.user_id as string)

  return rowToProject(row, assignedUserIds)
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
