import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import colors from "tailwindcss/colors.js"

/**
 * Tailwind default palette tokens for document / future persona accent colors.
 * Excludes red, rose, and orange (danger / alert connotations in the product).
 * Keep in sync with `supabase/migrations/*_project_documents_cite_color_token.sql` CHECK.
 */

const CITE_COLOR_FAMILIES = [
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "amber",
] as const

const CITE_COLOR_SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const

type CiteColorFamily = (typeof CITE_COLOR_FAMILIES)[number]
type CiteColorShade = (typeof CITE_COLOR_SHADES)[number]
export type CiteColorToken = `${CiteColorFamily}-${CiteColorShade}`

export const CITE_COLOR_TOKENS = CITE_COLOR_FAMILIES.flatMap((family) =>
  CITE_COLOR_SHADES.map((shade) => `${family}-${shade}` as CiteColorToken)
) as readonly CiteColorToken[]

const CITE_COLOR_TOKEN_SET = new Set<string>(CITE_COLOR_TOKENS)

/** Default when `cite_color_token` is null or unknown (brand accent for Sources / citations). */
export const DEFAULT_CITE_COLOR_TEXT_CLASS = "text-arse-pink"

/**
 * Resolved segment color when no `segment_color_token` is stored on the bound persona.
 * Not a {@link CiteColorToken} — DB columns must store `null` for this default; use
 * {@link segmentColorTokenForDatabase} before writes.
 */
export const SEGMENT_BRAND_DEFAULT_COLOR_TOKEN = "arse-pink" as const

export type SegmentBrandDefaultColorToken = typeof SEGMENT_BRAND_DEFAULT_COLOR_TOKEN

/** @deprecated Use {@link SEGMENT_BRAND_DEFAULT_COLOR_TOKEN} */
export const DEFAULT_SEGMENT_CITE_TOKEN = SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
export const CITE_COLOR_HEX = Object.fromEntries(
  CITE_COLOR_FAMILIES.flatMap((family) =>
    CITE_COLOR_SHADES.map((shade) => {
      const token = `${family}-${shade}` as CiteColorToken
      const value = (colors[family] as Record<string, string>)[shade]
      return [token, value]
    })
  )
) as Record<CiteColorToken, string>

export function isCiteColorToken(value: string): value is CiteColorToken {
  return CITE_COLOR_TOKEN_SET.has(value)
}

export function citeColorTextClass(token: string | null | undefined): string {
  if (token && isCiteColorToken(token)) {
    const [family] = token.split("-")
    return `text-${family}-500`
  }
  return DEFAULT_CITE_COLOR_TEXT_CLASS
}

export function citeColorTextHoverClass(token: string | null | undefined): string {
  if (token && isCiteColorToken(token)) return "hover:brightness-110"
  return "hover:text-arse-pink/90"
}

export function citeCitationButtonColorClasses(token: string | null | undefined): string {
  return `${citeColorTextClass(token)} ${citeColorTextHoverClass(token)}`
}

/** Hex for color picker / HSVA init; supports brand segment default outside cite allowlist. */
export function citePickerBaseHex(token: string | null | undefined): string {
  const raw = token?.trim()
  if (raw === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN) return "#ff00e6"
  if (raw && isCiteColorToken(raw)) return CITE_COLOR_HEX[raw]
  return "#ff00e6"
}

/**
 * Solid `#rrggbb` for inline styles. Always hex so callers can append alpha (e.g.
 * {@link citeColorSubtleOuterChipStyle}).
 */
export function citeColorCssValue(token: string | null | undefined): string {
  const raw = token?.trim()
  if (raw && isCiteColorToken(raw)) return CITE_COLOR_HEX[raw]
  return citePickerBaseHex(token)
}

export function citeColorBgClass(token: CiteColorToken): string {
  return token
}

export function citeColorHex(token: CiteColorToken): string {
  return CITE_COLOR_HEX[token]
}

/** Map resolved segment display token to a value allowed in `persona_segment_color_token` / cite columns. */
export function segmentColorTokenForDatabase(
  token: string | null | undefined
): string | null {
  const t = token?.trim()
  if (!t || t === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN) return null
  return isCiteColorToken(t) ? t : null
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "")
  const value = Number.parseInt(normalized, 16)
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  }
}

export function nearestCiteColorTokenFromRgb(color: {
  r: number
  g: number
  b: number
}): CiteColorToken {
  let bestToken: CiteColorToken = CITE_COLOR_TOKENS[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const token of CITE_COLOR_TOKENS) {
    const rgb = hexToRgb(CITE_COLOR_HEX[token])
    const distance =
      (rgb.r - color.r) * (rgb.r - color.r) +
      (rgb.g - color.g) * (rgb.g - color.g) +
      (rgb.b - color.b) * (rgb.b - color.b)
    if (distance < bestDistance) {
      bestDistance = distance
      bestToken = token
    }
  }
  return bestToken
}

/** Solid badge background for Data Sources index pills (default matches brand pink). */
const DEFAULT_CITE_BADGE_BG_CLASS = "bg-arse-pink"

export function citeColorBadgeBgClass(_token: string | null | undefined): string {
  return DEFAULT_CITE_BADGE_BG_CLASS
}

export function citeColorBackgroundStyle(token: string | null | undefined): {
  backgroundColor: string
} {
  return { backgroundColor: citeColorCssValue(token) }
}

/** When true, render dot fill with {@link citeColorBackgroundStyle} instead of a `bg-*` class. */
export function isCiteColorDotFillToken(token: string | null | undefined): boolean {
  const raw = token?.trim()
  return Boolean(
    raw &&
      (isCiteColorToken(raw) || raw === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN)
  )
}

export function citeColorDotFillStyle(token: string | null | undefined): CSSProperties | undefined {
  return isCiteColorDotFillToken(token) ? citeColorBackgroundStyle(token) : undefined
}

export function citeColorBorderStyle(token: string | null | undefined): {
  borderColor: string
} {
  return { borderColor: citeColorCssValue(token) }
}

const CITE_SOURCE_INDEX_BADGE_BASE =
  "h-5 shrink-0 items-center justify-center rounded-xl border border-white/15 px-0 font-arse-title text-[12px] font-bold tabular-nums leading-none text-white shadow-sm shadow-black/25"

/**
 * Index pill shared by Data Sources rows and inline citation triggers (matches `SourcesSelector`).
 */
export function citeSourceIndexBadgeCn(
  index: number,
  _citeColorToken: string | null | undefined,
  layout: "inline" | "row" = "inline"
): string {
  return cn(
    layout === "inline" ? "inline-flex align-middle" : "flex",
    CITE_SOURCE_INDEX_BADGE_BASE,
    index >= 10 ? "min-w-[1.375rem]" : "w-5"
  )
}

export function citeSourceIndexBadgeStyle(citeColorToken: string | null | undefined): {
  backgroundColor: string
} {
  return citeColorBackgroundStyle(citeColorToken)
}

/** Soft outer pill for citation chips (footer); index still uses `citeSourceIndexBadgeCn`. */
const DEFAULT_SUBTLE_OUTER_CHIP_CLASS = "border-arse-black/10 bg-arse-black/[0.03]"

export function citeColorSubtleOuterChipCn(_token: string | null | undefined): string {
  return DEFAULT_SUBTLE_OUTER_CHIP_CLASS
}

const DEFAULT_CITE_TOOLTIP_BORDER_CLASS = "border-arse-pink"

export function citeColorTooltipBorderCn(_token: string | null | undefined): string {
  return DEFAULT_CITE_TOOLTIP_BORDER_CLASS
}

export function citeColorSubtleOuterChipStyle(token: string | null | undefined): {
  borderColor: string
  backgroundColor: string
} {
  const hex = citeColorCssValue(token)
  return {
    borderColor: `${hex}40`,
    backgroundColor: `${hex}12`,
  }
}
