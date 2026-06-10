import type { UserRole } from "@/lib/types"

/** Normalized dashboard admin role check — matches `is_dashboard_admin()` in Postgres. */
export function isDashboardAdminRole(role: unknown): boolean {
  if (typeof role !== "string") return false
  return role.trim().toLowerCase() === "admin"
}

export function toSupportedRole(role: unknown): UserRole {
  if (typeof role !== "string") return "client"
  const normalized = role.trim().toLowerCase()
  if (normalized === "admin" || normalized === "client" || normalized === "user") {
    return normalized
  }
  return "client"
}
