import type { HistoryItem } from "@/lib/chat-history-types"
import type { SavedCustomAudience } from "@/lib/types"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import {
  audienceStackColorTokens,
  normalizeAudienceColorToken,
} from "@/lib/theme/custom-audience-theme"
import { personaSegmentColorTokenForId } from "@/lib/theme/persona-segment-theme"
import {
  SEGMENT_BRAND_DEFAULT_COLOR_TOKEN,
  isCiteColorToken,
} from "@/lib/theme/cite-color-tokens"

/**
 * Locate the saved audience row for a chat history item: prefer `custom_audience_id`,
 * then fall back to **case-insensitive name** so history rows stay aligned with the list
 * when ids are missing, stale, or from an older persist shape.
 */
export function findSavedCustomAudienceForChatHistoryRow(
  item: Pick<HistoryItem, "custom_audience_id" | "custom_audience_name">,
  savedAudiencesById: Map<string, SavedCustomAudience> | null | undefined
): SavedCustomAudience | undefined {
  const map = savedAudiencesById
  if (!map?.size) return undefined
  const id = item.custom_audience_id?.trim()
  if (id && map.has(id)) return map.get(id)
  const needle = item.custom_audience_name?.trim().toLowerCase()
  if (!needle) return undefined
  for (const audience of map.values()) {
    if (audience.name.trim().toLowerCase() === needle) return audience
  }
  return undefined
}

/**
 * One display token per child segment: live admin binding wins, then snapshot token,
 * then brand default.
 */
export function displayColorTokenForSegmentBinding(args: {
  segmentId: string
  snapshotColorToken: string | null | undefined
  resolvedPersonas: PersonaMock[] | null | undefined
}): string {
  const fromLive = personaSegmentColorTokenForId(
    args.segmentId,
    args.resolvedPersonas
  )
  if (fromLive) return fromLive
  const t = args.snapshotColorToken?.trim()
  if (
    t &&
    (isCiteColorToken(t) || t === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN)
  ) {
    return t
  }
  return SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
}

/** Ordered stack for UI (one dot per child), aligned with `snapshot.childSegments`. */
export function savedCustomAudienceStackDisplayTokens(
  audience: SavedCustomAudience,
  resolvedPersonas: PersonaMock[] | null | undefined
): string[] {
  const children = audience.snapshot.childSegments
  if (children.length > 0) {
    return children.map((child) =>
      displayColorTokenForSegmentBinding({
        segmentId: child.id,
        snapshotColorToken: child.colorToken,
        resolvedPersonas,
      })
    )
  }
  if (audience.childSegmentColorTokens.length > 0) {
    return audience.childSegmentColorTokens.map(
      (t) => normalizeAudienceColorToken(t) ?? SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
    )
  }
  return [SEGMENT_BRAND_DEFAULT_COLOR_TOKEN]
}

/**
 * Chat history row dots: prefer current saved-audience snapshot (so edits add segments),
 * else rebind denormalized id/token arrays from `chat_results`, else stack from stored tokens.
 */
export function resolvedChatHistoryAudienceStackTokens(
  item: Pick<
    HistoryItem,
    | "custom_audience_id"
    | "custom_audience_name"
    | "custom_audience_child_segment_ids"
    | "custom_audience_child_segment_color_tokens"
    | "persona_segment_id"
    | "persona_segment_color_token"
  >,
  savedAudiencesById: Map<string, SavedCustomAudience> | null | undefined,
  resolvedPersonas: PersonaMock[] | null | undefined
): string[] {
  const saved = findSavedCustomAudienceForChatHistoryRow(item, savedAudiencesById)
  if (saved?.snapshot.childSegments.length) {
    return savedCustomAudienceStackDisplayTokens(saved, resolvedPersonas)
  }

  const ids = item.custom_audience_child_segment_ids ?? []
  const tokens = item.custom_audience_child_segment_color_tokens ?? []
  if (ids.length > 0) {
    return ids.map((rawId, index) => {
      const segId = rawId?.trim()
      if (!segId) {
        return (
          normalizeAudienceColorToken(tokens[index]) ??
          SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
        )
      }
      return displayColorTokenForSegmentBinding({
        segmentId: segId,
        snapshotColorToken: tokens[index] ?? null,
        resolvedPersonas,
      })
    })
  }

  const personaId = item.persona_segment_id?.trim()
  if (personaId) {
    const live = personaSegmentColorTokenForId(personaId, resolvedPersonas)
    if (live) return [live]
  }

  return audienceStackColorTokens(
    item.custom_audience_child_segment_color_tokens,
    item.persona_segment_color_token
  )
}
