import type { SavedCustomAudience } from "@/lib/types"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import { audienceStackColorTokens } from "@/lib/theme/custom-audience-theme"
import { personaSegmentColorTokenForId } from "@/lib/theme/persona-segment-theme"
import {
  DEFAULT_CHAT_TONE,
  personaChatToneFromCiteToken,
  type PersonaChatTone,
} from "@/lib/theme/persona-chat-tone"

/** Survey n used only to pick the dominant mock segment for a custom audience (see persona drawer mocks). */
const SEGMENT_PERSONA_SURVEY_N: Record<string, number> = {
  "seg-do-nothing": 66,
  "seg-minimalists": 112,
  "seg-muddled-middle": 508,
  "seg-do-their-bit": 240,
}

export function dominantSegmentPersonaIdFromChildSegmentIds(
  segmentIds: string[] | null | undefined
): string | null {
  const seen = new Set<string>()
  const scored: { id: string; n: number }[] = []
  for (const raw of segmentIds ?? []) {
    const id = raw?.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    const n = SEGMENT_PERSONA_SURVEY_N[id]
    if (n != null && n > 0) scored.push({ id, n })
  }
  if (scored.length === 0) return null
  return scored.reduce((a, b) => (a.n >= b.n ? a : b)).id
}

export function dominantSegmentPersonaIdFromSavedAudience(
  audience: SavedCustomAudience | null | undefined
): string | null {
  if (!audience) return null
  return dominantSegmentPersonaIdFromChildSegmentIds(
    audience.snapshot.childSegments.map((s) => s.id)
  )
}

export function chatToneForSavedCustomAudience(
  audience: SavedCustomAudience | null | undefined
): PersonaChatTone {
  if (!audience) return DEFAULT_CHAT_TONE
  const dominantId = dominantSegmentPersonaIdFromSavedAudience(audience)
  if (!dominantId) return DEFAULT_CHAT_TONE
  const child = audience.snapshot.childSegments.find((s) => s.id === dominantId)
  return personaChatToneFromCiteToken(child?.colorToken ?? null)
}

/**
 * Primary segment color token for chat history row accents when a custom audience is active:
 * the dominant child segment (largest mock survey n), not the first denormalized color token.
 */
export function chatHistoryPrimaryPersonaColorToken(args: {
  customAudienceName?: string | null
  customAudienceChildSegmentIds?: string[] | null
  customAudienceChildSegmentColorTokens?: string[] | null
  personaSegmentColorToken?: string | null
  /** Live admin bindings; when absent, dominant segment uses static map only. */
  resolvedSegmentPersonas?: PersonaMock[] | null
}): string | null {
  const hasCustomLabel = Boolean(args.customAudienceName?.trim())
  const ids = args.customAudienceChildSegmentIds ?? []
  if (hasCustomLabel && ids.length > 0) {
    const dominantId = dominantSegmentPersonaIdFromChildSegmentIds(ids)
    const fromDominant = personaSegmentColorTokenForId(
      dominantId,
      args.resolvedSegmentPersonas
    )
    if (fromDominant) return fromDominant
  }
  return (
    audienceStackColorTokens(
      args.customAudienceChildSegmentColorTokens,
      args.personaSegmentColorToken
    )[0] ?? null
  )
}
