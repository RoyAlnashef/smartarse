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

function rowToOrganization(row: OrganizationRow, userCount: number): Organization {
  return {
    id: row.id,
    name: row.name,
    projectIds: [],
    userIds: Array.from({ length: userCount }, (_, idx) => `${row.id}-${idx}`),
    creditBalance: row.credit_balance ?? 0,
    status: normalizeOrgStatus(row.status),
    createdAt: row.created_at,
  }
}

export async function listOrganizationsForDashboard(): Promise<Organization[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const [orgsResult, usersResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug,created_at,updated_at,credit_balance,status")
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id,organization_id"),
  ])

  if (orgsResult.error) {
    throw new Error(orgsResult.error.message)
  }

  const userCountsByOrg = new Map<string, number>()
  if (!usersResult.error) {
    ;(usersResult.data as UserOrgRow[] | null)?.forEach((user) => {
      if (!user.organization_id) return
      userCountsByOrg.set(user.organization_id, (userCountsByOrg.get(user.organization_id) ?? 0) + 1)
    })
  }

  const rows = (orgsResult.data ?? []) as OrganizationRow[]
  return rows.map((row) =>
    rowToOrganization(row, userCountsByOrg.get(row.id) ?? 0)
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
      return rowToOrganization(data as OrganizationRow, 0)
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

export async function setOrganizationStatus(
  id: string,
  status: Organization["status"]
): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const { error } = await supabase.from("organizations").update({ status }).eq("id", id)

  if (error) throw new Error(error.message)
}
