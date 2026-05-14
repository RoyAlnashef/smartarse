import type { CSSProperties } from "react"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import { citeColorCssValue } from "@/lib/theme/cite-color-tokens"

/** Strip leading "The " and lower-case so "The Minimalists" / "minimalists" both match. */
function normalizeSegmentKey(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .toLowerCase()
    .replace(/^the\s+/, "")
    .trim()
}

/**
 * Resolve the admin-set cite color token for a free-form segment label by
 * fuzzy-matching against the project's persona list.
 *
 * Used by interview chunk badges and the survey sample-description pill so
 * the same segment renders the same accent color across citation surfaces.
 * Accepts short forms ("Minimalists") and qualified forms ("The Minimalists");
 * normalisation strips a leading "The " and lower-cases both sides, then
 * accepts partial overlaps either direction.
 */
export function resolveSegmentColorToken(
  segmentName: string | null | undefined,
  personas: PersonaMock[]
): string | null {
  const key = normalizeSegmentKey(segmentName)
  if (!key) return null
  for (const persona of personas) {
    const personaKey = normalizeSegmentKey(persona.title)
    if (!personaKey) continue
    if (
      personaKey === key ||
      personaKey.includes(key) ||
      key.includes(personaKey)
    ) {
      return persona.colorCiteToken ?? null
    }
  }
  return null
}

/**
 * Inline style for segment pills: tinted background (segment hex at 12%
 * alpha) + segment hex text color. Returns `undefined` for unrecognised
 * tokens so callers can fall back to a neutral muted pill.
 */
export function segmentBadgeStyle(
  token: string | null | undefined
): CSSProperties | undefined {
  if (!token) return undefined
  const hex = citeColorCssValue(token)
  return {
    backgroundColor: `${hex}1f`,
    color: hex,
  }
}
