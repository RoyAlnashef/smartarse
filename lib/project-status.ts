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
