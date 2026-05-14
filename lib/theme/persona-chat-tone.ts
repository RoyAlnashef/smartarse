import {
  isCiteColorToken,
  SEGMENT_BRAND_DEFAULT_COLOR_TOKEN,
} from "@/lib/theme/cite-color-tokens"

/**
 * Chat shell / composer accent when a segment persona or custom audience is active.
 * Custom audiences resolve tone via {@link chatToneForSavedCustomAudience} (dominant child segment).
 */
export type PersonaChatTone = {
  cardBorder: string
  cardBg: string
  headingText: string
  dotBg: string
  dotPing: string
  shellBorder: string
  inputFocusRing: string
  actionShadow: string
  actionShadowHover: string
  actionShadowDisabled: string
}

/** Default segment chrome (brand pink, not Tailwind `pink-*`). */
export const BRAND_SEGMENT_CHAT_TONE: PersonaChatTone = {
  cardBorder: "border-arse-pink/25",
  cardBg: "bg-arse-pink/10",
  headingText: "text-arse-black/80",
  dotBg: "bg-arse-pink",
  dotPing: "bg-arse-pink/80",
  shellBorder: "border-arse-pink",
  inputFocusRing: "focus:ring-arse-pink",
  actionShadow: "shadow-[4px_4px_0_0_var(--arse-pink)]",
  actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--arse-pink)]",
  actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--arse-pink)]",
}

/** When an admin explicitly picks a Tailwind `pink-*` cite token. */
const TAILWIND_PINK_FAMILY_CHAT_TONE: PersonaChatTone = {
  cardBorder: "border-pink-200",
  cardBg: "bg-pink-50/60",
  headingText: "text-pink-700",
  dotBg: "bg-pink-500",
  dotPing: "bg-pink-400",
  shellBorder: "border-pink-500",
  inputFocusRing: "focus:ring-pink-500",
  actionShadow: "shadow-[4px_4px_0_0_var(--color-pink-500)]",
  actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-pink-500)]",
  actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-pink-500)]",
}

const CHAT_TONE_BY_PALETTE_FAMILY: Partial<Record<string, PersonaChatTone>> = {
  pink: TAILWIND_PINK_FAMILY_CHAT_TONE,
  indigo: {
    cardBorder: "border-indigo-200",
    cardBg: "bg-indigo-50/60",
    headingText: "text-indigo-700",
    dotBg: "bg-indigo-500",
    dotPing: "bg-indigo-400",
    shellBorder: "border-indigo-500",
    inputFocusRing: "focus:ring-indigo-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-indigo-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-indigo-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-indigo-500)]",
  },
  sky: {
    cardBorder: "border-sky-200",
    cardBg: "bg-sky-50/70",
    headingText: "text-sky-700",
    dotBg: "bg-sky-500",
    dotPing: "bg-sky-400",
    shellBorder: "border-sky-500",
    inputFocusRing: "focus:ring-sky-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-sky-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-sky-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-sky-500)]",
  },
  violet: {
    cardBorder: "border-violet-200",
    cardBg: "bg-violet-50/70",
    headingText: "text-violet-700",
    dotBg: "bg-violet-500",
    dotPing: "bg-violet-400",
    shellBorder: "border-violet-500",
    inputFocusRing: "focus:ring-violet-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-violet-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-violet-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-violet-500)]",
  },
  purple: {
    cardBorder: "border-purple-200",
    cardBg: "bg-purple-50/70",
    headingText: "text-purple-700",
    dotBg: "bg-purple-500",
    dotPing: "bg-purple-400",
    shellBorder: "border-purple-500",
    inputFocusRing: "focus:ring-purple-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-purple-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-purple-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-purple-500)]",
  },
  yellow: {
    cardBorder: "border-yellow-200",
    cardBg: "bg-yellow-50/70",
    headingText: "text-yellow-700",
    dotBg: "bg-yellow-500",
    dotPing: "bg-yellow-400",
    shellBorder: "border-yellow-500",
    inputFocusRing: "focus:ring-yellow-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-yellow-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-yellow-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-yellow-500)]",
  },
  cyan: {
    cardBorder: "border-cyan-200",
    cardBg: "bg-cyan-50/70",
    headingText: "text-cyan-700",
    dotBg: "bg-cyan-500",
    dotPing: "bg-cyan-400",
    shellBorder: "border-cyan-500",
    inputFocusRing: "focus:ring-cyan-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-cyan-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-cyan-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-cyan-500)]",
  },
  blue: {
    cardBorder: "border-blue-200",
    cardBg: "bg-blue-50/70",
    headingText: "text-blue-700",
    dotBg: "bg-blue-500",
    dotPing: "bg-blue-400",
    shellBorder: "border-blue-500",
    inputFocusRing: "focus:ring-blue-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-blue-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-blue-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-blue-500)]",
  },
  green: {
    cardBorder: "border-green-200",
    cardBg: "bg-green-50/70",
    headingText: "text-green-700",
    dotBg: "bg-green-500",
    dotPing: "bg-green-400",
    shellBorder: "border-green-500",
    inputFocusRing: "focus:ring-green-500",
    actionShadow: "shadow-[4px_4px_0_0_var(--color-green-500)]",
    actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--color-green-500)]",
    actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--color-green-500)]",
  },
}

/**
 * Chat chrome from a resolved cite token (segment persona or snapshot child `colorToken`).
 * Brand default {@link SEGMENT_BRAND_DEFAULT_COLOR_TOKEN} uses {@link BRAND_SEGMENT_CHAT_TONE}.
 */
export function personaChatToneFromCiteToken(
  token: string | null | undefined
): PersonaChatTone {
  const raw = token?.trim()
  if (!raw || raw === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN) {
    return BRAND_SEGMENT_CHAT_TONE
  }
  if (!isCiteColorToken(raw)) {
    return BRAND_SEGMENT_CHAT_TONE
  }
  const family = raw.split("-")[0] ?? ""
  return CHAT_TONE_BY_PALETTE_FAMILY[family] ?? BRAND_SEGMENT_CHAT_TONE
}

/** @deprecated Use {@link BRAND_SEGMENT_CHAT_TONE} */
export const PINK_SEGMENT_CHAT_TONE = BRAND_SEGMENT_CHAT_TONE

/** @deprecated Prefer {@link personaChatToneFromCiteToken} with resolved `PersonaMock.colorCiteToken`. */
export const PERSONA_CHAT_TONE_BY_ID: Record<string, PersonaChatTone> = {
  "seg-do-nothing": BRAND_SEGMENT_CHAT_TONE,
  "seg-minimalists": BRAND_SEGMENT_CHAT_TONE,
  "seg-muddled-middle": BRAND_SEGMENT_CHAT_TONE,
  "seg-do-their-bit": BRAND_SEGMENT_CHAT_TONE,
}

export const DEFAULT_CHAT_TONE: PersonaChatTone = {
  cardBorder: "border-arse-black/20",
  cardBg: "bg-white",
  headingText: "text-arse-black/70",
  dotBg: "bg-arse-black/40",
  dotPing: "bg-arse-pink",
  shellBorder: "border-arse-pink",
  inputFocusRing: "focus:ring-arse-pink",
  actionShadow: "shadow-[4px_4px_0_0_var(--arse-pink)]",
  actionShadowHover: "hover:shadow-[3px_3px_0_0_var(--arse-pink)]",
  actionShadowDisabled: "disabled:hover:shadow-[4px_4px_0_0_var(--arse-pink)]",
}
