export const CANONICAL_SEGMENT_IDS = [
  "seg-do-nothing",
  "seg-minimalists",
  "seg-muddled-middle",
  "seg-do-their-bit",
] as const

export type CanonicalSegmentId = (typeof CANONICAL_SEGMENT_IDS)[number]

const CANONICAL_SEGMENT_ID_SET = new Set<string>(CANONICAL_SEGMENT_IDS)

export function isCanonicalSegmentId(value: string): value is CanonicalSegmentId {
  return CANONICAL_SEGMENT_ID_SET.has(value)
}

/** Short labels for admin “represents segment” selects. */
export const CANONICAL_SEGMENT_OPTION_LABEL: Record<CanonicalSegmentId, string> = {
  "seg-do-nothing": "S1 — Do Nothing-ers",
  "seg-minimalists": "S2 — Minimalists",
  "seg-muddled-middle": "S3 — Muddled Middle",
  "seg-do-their-bit": "S4 — Do Their Bit",
}
