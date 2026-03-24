"use client"

import type { User, UserRole } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type UserRow = {
  id: string
  email: string | null
  role: string | null
  organization_id: string | null
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

  return {
    id: row.id,
    name: displayName,
    email,
    role: mapRole(row.role),
    clientId: row.organization_id ?? undefined,
    status: "active",
    lastLogin: created,
    createdAt: created,
  }
}

export async function listUsersForDashboard(): Promise<User[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("users")
    .select("id,email,role,organization_id,created_at,name")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as UserRow[]).map(rowToUser)
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
    })
    .eq("id", input.id)

  if (error) throw new Error(error.message)
}
