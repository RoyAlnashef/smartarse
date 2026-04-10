import type { Project } from "@/lib/types"
import { SUPPORT_EMAIL } from "@/lib/support-contact"

/** Plain copy for toasts, API errors, and non-HTML contexts. */
export const PROJECT_NOT_LIVE_CHAT_MESSAGE =
  `This project is currently paused. Contact the team at ${SUPPORT_EMAIL}.`

export function projectStatusLabel(status: Project["status"]): string {
  switch (status) {
    case "live":
      return "Live"
    case "paused":
      return "Paused"
    case "archived":
      return "Archived"
  }
}

export function projectStatusBadgeClassName(status: Project["status"]): string {
  switch (status) {
    case "live":
      return "bg-mint-100 text-mint-700"
    case "paused":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
    case "archived":
      return "bg-dark-100 text-dark-500"
  }
}

export function isProjectLiveForChat(status: Project["status"]): boolean {
  return status === "live"
}

/** Calendar day in UTC as `YYYY-MM-DD` (aligned with Postgres `current_date` in UTC). */
export function utcCalendarDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/** True when `accessUntil` is strictly before today's UTC calendar date. */
export function isAccessDateExpired(accessUntil: string | null): boolean {
  if (accessUntil == null || accessUntil === "") return false
  return accessUntil < utcCalendarDateString()
}

/** Inclusive end of the “access ending soon” window (days from today UTC calendar). */
export const ACCESS_UNTIL_WARNING_DAYS = 14

/** Whole days from today (UTC `YYYY-MM-DD`) until `accessUntil`; negative if that date is in the past. */
export function utcCalendarDaysUntil(ymd: string): number {
  const today = utcCalendarDateString()
  const a = new Date(`${today}T12:00:00.000Z`).getTime()
  const b = new Date(`${ymd}T12:00:00.000Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * True when project access has not yet lapsed but ends within {@link ACCESS_UNTIL_WARNING_DAYS}
 * calendar days (UTC), inclusive of the last day.
 */
export function isAccessDateNearing(
  accessUntil: string | null,
  warningDays: number = ACCESS_UNTIL_WARNING_DAYS
): boolean {
  if (accessUntil == null || accessUntil === "") return false
  if (isAccessDateExpired(accessUntil)) return false
  return utcCalendarDaysUntil(accessUntil) <= warningDays
}
