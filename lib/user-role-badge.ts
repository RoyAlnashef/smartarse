import type { UserRole } from "@/lib/types"

/** Matches dashboard Users table role column (pill badges). */
const roleBadgeColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  client: "bg-blue-100 text-blue-700",
  user: "bg-amber-100 text-amber-700",
}

const demoBadgeColors = "bg-teal-100 text-teal-700"

export function userRoleBadgeLabel(
  role: UserRole,
  isDemoUser?: boolean
): string {
  if (role === "user" && isDemoUser) return "demo"
  return role
}

export function userRoleBadgeClassName(
  role: UserRole,
  isDemoUser?: boolean
): string {
  const label = userRoleBadgeLabel(role, isDemoUser)
  const isDemoBadge = label === "demo"
  const casing = isDemoBadge ? "normal-case" : "capitalize"
  const colors = isDemoBadge ? demoBadgeColors : roleBadgeColors[role]
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${casing} ${colors}`
}
