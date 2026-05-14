import type {
  FocusGroupCountryContext,
  FocusGroupResponse,
  FocusGroupRound,
  SavedCustomAudience,
} from "@/lib/types"
import type { PersonaMock } from "@/lib/personas/segment-mocks"

const DEFAULT_STUDY_FALLBACK = "this study"

export type SegmentPersonaWebhookBriefInput = {
  title: string
  shortDescription: string
  concernScore: number
}

function archetypeFromConcern(
  avgConcern: number
): Readonly<{ label: string; mood: string; instructions: string }> {
  if (avgConcern < 3.5) {
    return {
      label: "The Do Nothing-ers",
      mood: "disengaged and pragmatic",
      instructions:
        "Speak in first person ('I', 'we'). Never reference percentages or 'the data shows'.",
    }
  }
  if (avgConcern < 6) {
    return {
      label: "The Minimalists",
      mood: "risk-averse and selective",
      instructions:
        "Speak in first person ('I', 'we'). Never reference percentages or 'the data shows'.",
    }
  }
  if (avgConcern < 8) {
    return {
      label: "The Muddled Middle Majority",
      mood: "earnest but hedging",
      instructions:
        "Use qualifiers ('sort of', 'I suppose', 'I try to'). Speak in first person plural ('we'). Never reference percentages, never say 'the data shows'.",
    }
  }
  return {
    label: "Do Their Bit for Others",
    mood: "committed and proactive",
    instructions:
      "Speak in first person ('I', 'we'). Never reference percentages or 'the data shows'.",
  }
}

function roundConcern(n: number): number {
  return Math.round(n * 100) / 100
}

/** Concern level prose for segment personas (mirrors webhook prototype tone). */
function segmentConcernDescriptor(score: number): string {
  if (score < 3) return "very low concern"
  if (score < 5) return "low-to-moderate concern"
  if (score < 7) return "moderate concern"
  if (score < 8.5) return "high concern"
  return "very high concern"
}

export function buildWebhookBriefForSegmentPersona(
  persona: SegmentPersonaWebhookBriefInput,
  ctx: { studyLabel?: string | null }
): { brief: string; concern: number } {
  const study =
    ctx.studyLabel?.trim() || DEFAULT_STUDY_FALLBACK
  const concern = roundConcern(persona.concernScore)
  const concernLabel = segmentConcernDescriptor(concern)
  const brief = [
    `You are a single respondent from the ${persona.title} segment of ${study}.`,
    `${persona.shortDescription.trim()} This segment has ${concernLabel} (${concern}/10).`,
    "Speak in first person ('I', 'we'). Never reference percentages or 'the data shows'.",
  ].join(" ")

  return { brief, concern }
}

export function buildWebhookBriefForCustomAudience(
  audience: SavedCustomAudience,
  ctx: { studyLabel?: string | null }
): { brief: string; concern: number } {
  const study =
    ctx.studyLabel?.trim() || DEFAULT_STUDY_FALLBACK
  const rawConcern = audience.avgConcern
  const concern =
    typeof rawConcern === "number" && Number.isFinite(rawConcern)
      ? roundConcern(rawConcern)
      : 5
  const { label, mood, instructions } = archetypeFromConcern(concern)

  const childNames = audience.snapshot.childSegments
    .map((s) => s.name)
    .filter(Boolean)
  const childPart =
    childNames.length > 0
      ? ` Child segments represented: ${childNames.join(", ")}.`
      : ""

  const summaryPart = audience.filtersSummary?.trim()
    ? ` ${audience.filtersSummary.trim()}`
    : ""

  const nPart =
    typeof audience.baseSize === "number" && audience.baseSize > 0
      ? `weighted n=${audience.baseSize}`
      : "sample size not shown"

  const brief = [
    `You represent a custom audience from ${study}: ${audience.name.trim()}.`,
    `${nPart}. Concern level ${concern}/10.${summaryPart}${childPart}`,
    `This audience aligns with the ${label} archetype — ${mood}. ${instructions}`,
  ].join(" ")

  return { brief, concern }
}

/* ── Focus group brief composition ─────────────────────────────────────────
 *
 * Each participant gets a fresh `persona_brief` per round, built by stacking:
 *
 *   1. base segment brief (same as single-segment chats)
 *   2. PREVIOUS DISCUSSION (all prior rounds, in order)
 *   3. OTHER PARTICIPANTS IN THIS ROUND SAID (this round's earlier speakers)
 *   4. RESPONSE STYLE stance modifier (per-segment intensity, see prototype
 *      `FocusGroupView.tsx` lines 91-96)
 *   5. COUNTRY CONTEXT lens (always present; mirrors prototype `chatInput`)
 *
 * The hook calling this composer is responsible for sequencing participants
 * and feeding the right prior context — this function is purely
 * deterministic given its inputs.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Per-segment intensity modifier so participants debate with distinct voices.
 *
 * Keys are persona ids from `lib/personas/segment-mocks.ts`. New segments
 * fall back to the muddled-middle modifier (neutral middle ground) so the
 * focus group still runs.
 */
const FOCUS_GROUP_STANCE_MODIFIERS: Record<string, string> = {
  "seg-do-nothing":
    "You are sceptical and resistant. Keep your response brief and guarded — do not over-explain.",
  "seg-minimalists":
    "You are cautiously interested but non-committal. Give a measured, pragmatic response.",
  "seg-muddled-middle":
    "You are genuinely torn — engage with the topic but let some confusion or uncertainty show through.",
  "seg-do-their-bit":
    "You are enthusiastic and engaged. Give a fuller, more animated response that reflects your commitment.",
}

function focusGroupCountryLabel(country: FocusGroupCountryContext): string {
  if (country === "uk") return "United Kingdom"
  if (country === "ksa") return "Saudi Arabia (KSA)"
  return "United Kingdom and Saudi Arabia (KSA)"
}

function renderPriorRounds(rounds: readonly FocusGroupRound[]): string {
  if (rounds.length === 0) return ""
  const lines = ["PREVIOUS DISCUSSION:"]
  for (const round of rounds) {
    lines.push(`ROUND ${round.roundNumber} TOPIC: "${round.topic}"`)
    for (const r of round.responses) {
      lines.push(`${r.participantLabel}: "${r.content}"`)
    }
  }
  return `\n\n${lines.join("\n")}`
}

function renderThisRoundSoFar(
  responses: readonly FocusGroupResponse[]
): string {
  if (responses.length === 0) return ""
  const lines = ["OTHER PARTICIPANTS IN THIS ROUND SAID:"]
  for (const r of responses) {
    lines.push(`${r.participantLabel}: "${r.content}"`)
  }
  return `\n\n${lines.join("\n")}`
}

export type FocusGroupParticipantBriefContext = {
  /** Rounds already completed within this session (oldest → newest). */
  priorRounds: readonly FocusGroupRound[]
  /** Responses already given in the current round (speaking order). */
  thisRoundResponsesSoFar: readonly FocusGroupResponse[]
  /** Session country lens; included on every brief. */
  country: FocusGroupCountryContext
  /** Optional study label override (defaults to `this study`). */
  studyLabel?: string | null
}

export function buildFocusGroupParticipantBrief(
  persona: PersonaMock,
  ctx: FocusGroupParticipantBriefContext
): { brief: string; concern: number } {
  const { brief: baseBrief, concern } = buildWebhookBriefForSegmentPersona(
    {
      title: persona.title,
      shortDescription: persona.shortDescription,
      concernScore: persona.concernScore,
    },
    { studyLabel: ctx.studyLabel ?? null }
  )

  const stance =
    FOCUS_GROUP_STANCE_MODIFIERS[persona.id] ??
    FOCUS_GROUP_STANCE_MODIFIERS["seg-muddled-middle"]

  const sections = [
    baseBrief,
    renderPriorRounds(ctx.priorRounds),
    renderThisRoundSoFar(ctx.thisRoundResponsesSoFar),
    `\n\nRESPONSE STYLE: ${stance}`,
    `\n\nCOUNTRY CONTEXT: ${focusGroupCountryLabel(ctx.country)}.`,
  ]

  return { brief: sections.join(""), concern }
}

