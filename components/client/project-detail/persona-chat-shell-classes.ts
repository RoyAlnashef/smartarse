import type { ChatTimelineItem } from "@/lib/types"
import { isCustomAudienceActivatedEvent, isPersonaActivatedEvent } from "@/lib/types"

/**
 * Shared shell height for client project chat + desktop personas column.
 * `--client-workspace-chrome-y` is set on the client layout root (`app/client/layout.tsx`)
 * so shells never exceed the viewport below the header/footer and project page padding.
 *
 * Mobile chat uses `svh` (not `dvh`) so max height stays stable when the browser chrome
 * shows/hides during page scroll.
 *
 * Mobile compact: `h-fit` hugs short activation cards (capped by viewport max-h).
 * Mobile expanded: restores the original fixed shell sizing (`min-h-[600px]` +
 * `h-[min(32rem, viewport − chrome)]`) so default greetings and populated threads
 * match the pre-change chat window height; inner transcript scrolls when content overflows.
 *
 * Desktop: `lg:h-full` with a 600px floor fills the workspace column.
 */
export const PERSONA_CHAT_SHELL_BASE_CLASS =
  "lg:h-full lg:min-h-[600px] lg:max-h-[calc(100dvh-var(--client-workspace-chrome-y,17.5rem))]"

export const PERSONA_CHAT_SHELL_MOBILE_COMPACT_CLASS =
  "max-lg:h-fit max-lg:max-h-[calc(100svh-var(--client-workspace-chrome-y,17.5rem))]"

export const PERSONA_CHAT_SHELL_MOBILE_EXPANDED_CLASS =
  "max-lg:min-h-[600px] max-lg:h-[min(32rem,calc(100svh-var(--client-workspace-chrome-y,10rem)))] max-lg:max-h-[calc(100svh-var(--client-workspace-chrome-y,17.5rem))]"

/** @deprecated Use PERSONA_CHAT_SHELL_BASE_CLASS + compact/expanded mobile class. */
export const PERSONA_CHAT_SHELL_CLASS = `${PERSONA_CHAT_SHELL_BASE_CLASS} ${PERSONA_CHAT_SHELL_MOBILE_EXPANDED_CLASS}`

/** Desktop personas column: hug content up to the viewport cap (then inner areas scroll). */
export const PERSONA_RIGHT_COLUMN_SHELL_CLASS =
  "h-fit max-h-[calc(100dvh-var(--client-workspace-chrome-y,17.5rem))] min-h-[600px] w-full"

export function isMobileChatShellCompact({
  timelineItems,
  focusGroupActive,
  focusGroupRoundCount,
  hasLiveFocusGroupRound,
  isLoading,
}: {
  timelineItems: readonly ChatTimelineItem[]
  focusGroupActive: boolean
  focusGroupRoundCount: number
  hasLiveFocusGroupRound: boolean
  isLoading: boolean
}): boolean {
  if (isLoading) return false

  if (focusGroupActive) {
    return focusGroupRoundCount === 0 && !hasLiveFocusGroupRound
  }

  if (timelineItems.length === 0) {
    return false
  }

  if (timelineItems.length === 1) {
    const item = timelineItems[0]
    return isPersonaActivatedEvent(item) || isCustomAudienceActivatedEvent(item)
  }

  return false
}
