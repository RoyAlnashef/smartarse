import type { UserRole } from "@/lib/types"

/** Matches dashboard Users table role column (pill badges). */
const roleBadgeColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  client: "bg-blue-100 text-blue-700",
  user: "bg-amber-100 text-amber-700",
}

export function userRoleBadgeClassName(role: UserRole): string {
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[role]}`
}
