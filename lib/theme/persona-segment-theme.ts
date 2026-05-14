import { cn } from "@/lib/utils"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import { MOCK_SEGMENT_PERSONAS } from "@/lib/personas/segment-mocks"
import {
  SEGMENT_BRAND_DEFAULT_COLOR_TOKEN,
  isCiteColorToken,
} from "@/lib/theme/cite-color-tokens"

/**
 * Default cite token per canonical segment id (2025 study palette).
 * Used when `project_personas` has no color yet or resolver list is unavailable — **not** all brand pink.
 */
export const PERSONA_SEGMENT_COLOR_TOKEN_BY_ID: Record<string, string> =
  Object.fromEntries(
    MOCK_SEGMENT_PERSONAS.map((p) => [p.id, p.colorCiteToken])
  ) as Record<string, string>

const PERSONA_SEGMENT_COLOR_DOT_CLASS: Record<string, string> = {
  "arse-pink": "bg-arse-pink",
  "pink-500": "bg-pink-500",
  "indigo-500": "bg-indigo-500",
  "sky-500": "bg-sky-500",
  "violet-500": "bg-violet-500",
  "violet-600": "bg-violet-600",
  "yellow-500": "bg-yellow-500",
}

const PERSONA_SEGMENT_TEXT_CLASS: Record<string, string> = {
  "arse-pink": "text-arse-pink",
  "pink-500": "text-pink-400",
  "indigo-500": "text-indigo-400",
  "sky-500": "text-sky-400",
  "violet-500": "text-violet-400",
  "violet-600": "text-violet-400",
  "yellow-500": "text-yellow-400",
}

const PERSONA_SEGMENT_HOVER_TEXT_CLASS: Record<string, string> = {
  "arse-pink": "hover:text-arse-pink/90",
  "pink-500": "hover:text-pink-300",
  "indigo-500": "hover:text-indigo-300",
  "sky-500": "hover:text-sky-300",
  "violet-500": "hover:text-violet-300",
  "violet-600": "hover:text-violet-300",
  "yellow-500": "hover:text-yellow-300",
}

/** `:active` press feedback for row labels (mirrors hover tints). */
const PERSONA_SEGMENT_ACTIVE_TEXT_CLASS: Record<string, string> = {
  "arse-pink": "active:text-arse-pink/90",
  "pink-500": "active:text-pink-300",
  "indigo-500": "active:text-indigo-300",
  "sky-500": "active:text-sky-300",
  "violet-500": "active:text-violet-300",
  "violet-600": "active:text-violet-300",
  "yellow-500": "active:text-yellow-300",
}

const PERSONA_SEGMENT_ACTIVE_ROW_CLASS: Record<string, string> = {
  "arse-pink": "bg-arse-pink/10 ring-1 ring-arse-pink/40",
  "pink-500": "bg-pink-500/10 ring-1 ring-pink-500/40",
  "indigo-500": "bg-indigo-500/10 ring-1 ring-indigo-500/40",
  "sky-500": "bg-sky-500/10 ring-1 ring-sky-500/40",
  "violet-500": "bg-violet-500/10 ring-1 ring-violet-500/40",
  "violet-600": "bg-violet-600/10 ring-1 ring-violet-600/40",
  "yellow-500": "bg-yellow-500/10 ring-1 ring-yellow-500/40",
}

const PERSONA_SEGMENT_BADGE_CLASS: Record<string, string> = {
  "arse-pink": "bg-arse-pink/15 text-arse-black",
  "pink-500": "bg-pink-500/10 text-pink-700",
  "indigo-500": "bg-indigo-500/10 text-indigo-700",
  "sky-500": "bg-sky-500/10 text-sky-700",
  "violet-500": "bg-violet-500/10 text-violet-700",
  "violet-600": "bg-violet-600/10 text-violet-700",
  "yellow-500": "bg-yellow-500/10 text-yellow-700",
}

export function personaSegmentColorTokenForId(
  personaSegmentId: string | null | undefined,
  resolvedPersonas?: PersonaMock[] | null
): string | null {
  const key = personaSegmentId?.trim()
  if (!key) return null
  if (resolvedPersonas && resolvedPersonas.length > 0) {
    const found = resolvedPersonas.find((p) => p.id === key)
    const t = found?.colorCiteToken?.trim()
    if (t) {
      if (isCiteColorToken(t)) return t
      if (t === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN) return t
    }
  }
  return PERSONA_SEGMENT_COLOR_TOKEN_BY_ID[key] ?? null
}

export function personaSegmentDotClass(
  colorToken: string | null | undefined,
  fallback = "bg-arse-pink"
): string {
  const key = colorToken?.trim()
  if (!key) return fallback
  return PERSONA_SEGMENT_COLOR_DOT_CLASS[key] ?? fallback
}

export function personaSegmentTextClass(
  colorToken: string | null | undefined,
  fallback = "text-arse-pink"
): string {
  const key = colorToken?.trim()
  return key ? (PERSONA_SEGMENT_TEXT_CLASS[key] ?? fallback) : fallback
}

export function personaSegmentHoverTextClass(
  colorToken: string | null | undefined,
  fallback = "hover:text-arse-pink"
): string {
  const key = colorToken?.trim()
  return key ? (PERSONA_SEGMENT_HOVER_TEXT_CLASS[key] ?? fallback) : fallback
}

export function personaSegmentActiveTextClass(
  colorToken: string | null | undefined,
  fallback = "active:text-arse-pink"
): string {
  const key = colorToken?.trim()
  return key ? (PERSONA_SEGMENT_ACTIVE_TEXT_CLASS[key] ?? fallback) : fallback
}

export function personaSegmentActiveRowClass(
  colorToken: string | null | undefined,
  fallback = "bg-arse-cyan/10 ring-1 ring-arse-cyan/40"
): string {
  const key = colorToken?.trim()
  return key ? (PERSONA_SEGMENT_ACTIVE_ROW_CLASS[key] ?? fallback) : fallback
}

export function personaSegmentMetaBadgeClass(
  colorToken: string | null | undefined
): string {
  const key = colorToken?.trim()
  return cn(
    "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
    key ? (PERSONA_SEGMENT_BADGE_CLASS[key] ?? "bg-muted text-muted-foreground") : "bg-muted text-muted-foreground"
  )
}
