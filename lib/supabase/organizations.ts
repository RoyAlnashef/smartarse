"use client"

import type { Organization } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type OrganizationRow = {
  id: string
  name: string
  slug: string | null
  created_at: string
  updated_at: string
  credit_balance: number | null
  status: string | null
}

type UserOrgRow = {
  id: string
  organization_id: string | null
}

type ProjectOrgRow = {
  id: string
  organization_id: string
}

function normalizeOrgStatus(value: string | null | undefined): Organization["status"] {
  return value === "inactive" ? "inactive" : "active"
}

function slugFromName(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "org"
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8)
  return `${base}-${suffix}`
}

function rowToOrganization(
  row: OrganizationRow,
  userCount: number,
  projectIds: string[],
  chatCount = 0
): Organization {
  return {
    id: row.id,
    name: row.name,
    projectIds,
    userIds: Array.from({ length: userCount }, (_, idx) => `${row.id}-${idx}`),
    chatCount,
    creditBalance: row.credit_balance ?? 0,
    status: normalizeOrgStatus(row.status),
    createdAt: row.created_at,
  }
}

async function fetchChatCountsByOrganization(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  organizationIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (organizationIds.length === 0) return map

  const { data, error } = await supabase
    .from("chat_results")
    .select("organization_id")
    .in("organization_id", organizationIds)

  if (error) throw new Error(error.message)

  for (const row of data ?? []) {
    const oid = row.organization_id as string
    map.set(oid, (map.get(oid) ?? 0) + 1)
  }
  return map
}

export async function listOrganizationsForDashboard(): Promise<Organization[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const [orgsResult, usersResult, projectsResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug,created_at,updated_at,credit_balance,status")
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id,organization_id"),
    supabase.from("projects").select("id,organization_id").order("created_at", { ascending: true }),
  ])

  if (orgsResult.error) {
    throw new Error(orgsResult.error.message)
  }
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message)
  }

  const userCountsByOrg = new Map<string, number>()
  if (!usersResult.error) {
    ;(usersResult.data as UserOrgRow[] | null)?.forEach((user) => {
      if (!user.organization_id) return
      userCountsByOrg.set(user.organization_id, (userCountsByOrg.get(user.organization_id) ?? 0) + 1)
    })
  }

  const projectIdsByOrg = new Map<string, string[]>()
  for (const project of (projectsResult.data as ProjectOrgRow[] | null) ?? []) {
    const list = projectIdsByOrg.get(project.organization_id) ?? []
    list.push(project.id)
    projectIdsByOrg.set(project.organization_id, list)
  }

  const rows = (orgsResult.data ?? []) as OrganizationRow[]
  const orgIds = rows.map((r) => r.id)
  const chatCountsByOrg = await fetchChatCountsByOrganization(supabase, orgIds)

  return rows.map((row) =>
    rowToOrganization(
      row,
      userCountsByOrg.get(row.id) ?? 0,
      projectIdsByOrg.get(row.id) ?? [],
      chatCountsByOrg.get(row.id) ?? 0
    )
  )
}

export async function createOrganization(name: string): Promise<Organization> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const trimmed = name.trim()
  if (!trimmed) throw new Error("Organization name is required.")

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = slugFromName(trimmed)
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: trimmed,
        slug,
        status: "active",
      })
      .select("id,name,slug,created_at,updated_at,credit_balance,status")
      .single()

    if (!error && data) {
      return rowToOrganization(data as OrganizationRow, 0, [])
    }

    lastError = new Error(error?.message ?? "Failed to create organization.")
    const msg = error?.message ?? ""
    if (!msg.includes("duplicate") && !msg.includes("unique") && !msg.includes("violates")) {
      throw lastError
    }
  }

  throw lastError
}

export async function updateOrganization(input: {
  id: string
  name: string
  status: Organization["status"]
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const trimmed = input.name.trim()
  if (!trimmed) throw new Error("Organization name is required.")

  const { error } = await supabase
    .from("organizations")
    .update({
      name: trimmed,
      status: input.status,
    })
    .eq("id", input.id)

  if (error) throw new Error(error.message)
}

export async function deleteOrganization(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const { error } = await supabase.rpc("delete_organization_if_empty", { p_org_id: id })

  if (error) throw new Error(error.message)
}

export async function setOrganizationStatus(
  id: string,
  status: Organization["status"]
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const { error } = await supabase.from("organizations").update({ status }).eq("id", id)

  if (error) throw new Error(error.message)
}
