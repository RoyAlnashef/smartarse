import type { Project } from "@/lib/types"
import { SUPPORT_EMAIL } from "@/lib/support-contact"
import {
  londonCalendarDateString,
  londonCalendarDaysUntil,
} from "@/lib/datetime"

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

export { londonCalendarDateString, londonCalendarDaysUntil }

/** True when `accessUntil` is strictly before today's London calendar date. */
export function isAccessDateExpired(accessUntil: string | null): boolean {
  if (accessUntil == null || accessUntil === "") return false
  return accessUntil < londonCalendarDateString()
}

/** Inclusive end of the “access ending soon” window (days from today London calendar). */
export const ACCESS_UNTIL_WARNING_DAYS = 14

/**
 * True when project access has not yet lapsed but ends within {@link ACCESS_UNTIL_WARNING_DAYS}
 * calendar days (London), inclusive of the last day.
 */
export function isAccessDateNearing(
  accessUntil: string | null,
  warningDays: number = ACCESS_UNTIL_WARNING_DAYS
): boolean {
  if (accessUntil == null || accessUntil === "") return false
  if (isAccessDateExpired(accessUntil)) return false
  return londonCalendarDaysUntil(accessUntil) <= warningDays
}
