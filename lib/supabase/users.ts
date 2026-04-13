"use client"

import type { User, UserRole } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type UserRow = {
  id: string
  email: string | null
  role: string | null
  organization_id: string | null
  status: string | null
  created_at: string | null
  name: string | null
}

function mapRole(value: string | null): UserRole {
  if (value === "admin" || value === "client" || value === "user") return value
  return "user"
}

function rowToUser(row: UserRow): User {
  const email = row.email ?? ""
  const displayName =
    row.name?.trim() ||
    (email.includes("@") ? email.split("@")[0] : null) ||
    "User"

  const created = row.created_at ?? new Date().toISOString()

  const normalizedStatus =
    row.status === "inactive" || !row.organization_id ? "inactive" : "active"

  return {
    id: row.id,
    name: displayName,
    email,
    role: mapRole(row.role),
    clientId: row.organization_id ?? undefined,
    status: normalizedStatus,
    lastLogin: created,
    createdAt: created,
    creditsSpentLifetime: 0,
  }
}

export async function listUsersForDashboard(): Promise<User[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("users")
    .select("id,email,role,organization_id,status,created_at,name")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  const users = ((data ?? []) as UserRow[]).map(rowToUser)

  const { data: spendRows, error: spendError } = await supabase.rpc(
    "dashboard_users_credit_spend"
  )
  if (spendError) throw new Error(spendError.message)

  const spendById = new Map<string, number>()
  for (const row of (spendRows ?? []) as {
    user_id: string
    credits_spent: number | string
  }[]) {
    spendById.set(row.user_id, Number(row.credits_spent))
  }

  return users.map((u) => ({
    ...u,
    creditsSpentLifetime: spendById.get(u.id) ?? 0,
  }))
}

export async function updateUserAdmin(input: {
  id: string
  name: string
  role: UserRole
  organizationId: string | null
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error("Supabase is not configured.")

  const nameTrimmed = input.name.trim()
  const organizationId = input.organizationId?.trim() ?? ""
  if (!organizationId) {
    throw new Error("Organization is required.")
  }

  const { error } = await supabase
    .from("users")
    .update({
      name: nameTrimmed || null,
      role: input.role,
      organization_id: organizationId,
      status: "active",
    })
    .eq("id", input.id)

  if (error) throw new Error(error.message)
}
