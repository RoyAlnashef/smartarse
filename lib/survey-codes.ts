/**
 * Hybrid survey question copy — fallback used when the assistant payload omits
 * `question_text` (per Phase 1 spec
 * `agent-os/specs/2026-05-07-1400-handover-survey-citations/plan.md`).
 *
 * Keys are Q codes (e.g. `Q1`, `Q2_a`) and values are the prose question wording.
 * Missing keys must degrade gracefully to an empty string, matching the handover
 * `<code>. <text>` rendering at
 * `agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx`.
 *
 * Seed strategy: the map is seeded from the live instrument wording supplied
 * by the AI/RAG team. Refresh entries as the instrument evolves and add new Q
 * codes as they appear in production payloads. Direct API `question_text` is
 * always preferred — this map is purely a wording fallback and should never
 * gate citation rendering.
 */

export const Q_CODE_QUESTIONS: Record<string, string> = {
  Q1: "In your own words, what does sustainability mean to you?",
  Q2: "Which of the following areas do you consider to be a part of sustainability?",
  Q3: "When you hear the phrase \"saving people and the planet\" what comes to mind?",
  Q4: "How concerned are you about sustainability and the impact on your life?",
  Q5: "How much would you say you understand about the role of sustainability in each of the following areas?",
  Q6: "When thinking about sustainability, which of the following issues are most important to you?",
  Q7: "How much influence do you believe your individual actions have on overall sustainability?",
  Q8: "How optimistic are you about society's ability to address sustainability challenges?",
  Q9: "In what ways do you currently try and do your bit to live more sustainably?",
  Q10: "How willing are you to make significant lifestyle changes in order to live more sustainably?",
  Q11: "What barriers prevent you from living more sustainably?",
  Q12: "What drives you to live more sustainably?",
  Q13: "To what extent do you agree or disagree with the following statements about sustainability and your role within it?",
  Q14: "To what extent do you agree or disagree with the following statements about businesses and sustainability?",
  Q15: "How seriously do you believe sustainability is being taken by different groups?",
  Q16: "In which of the following ways have you learned about the different aspects of sustainability?",
  Q17: "Who do you think bears the primary responsibility for addressing sustainability issues?",
  Q19: "What would make you more likely to adopt sustainable practices across different aspects of your life?",
  Q20: "Who in your community or society do you consider a role model for sustainable practices?",
  Q21: "Are there any specific events or information that have shaped your views on sustainability in recent years?",
  Q22: "Which industry does your company operate in?",
  Q23: "What type of area do you live in?",
  Q24: "Which one of the following ethnicities do you identify with?",
  Q25: "What is your religion?",
  S1: "Which of the following best describes your employment status?",
  S4: "Which of the following best describes your primary role at work?",
  S5: "What is your job title?",
  S6: "What level is your role within the organization?",
}

/**
 * Resolve question wording for a Q code. Returns an empty string when the code
 * is unknown so the caller can render `<code>. ` without a layout break.
 */
export function surveyQuestionText(code: string | null | undefined): string {
  if (!code) return ""
  const trimmed = code.trim()
  if (!trimmed) return ""
  const exact = Q_CODE_QUESTIONS[trimmed]
  if (exact) return exact

  // Normalize matrix/item suffixes so question variants like Q11r13oe,
  // Q5r1, and Q13r1c1 resolve to their family-level question text.
  const family = trimmed.match(/^(QC?\d+|S\d+)/i)?.[1]?.toUpperCase()
  if (!family) return ""
  return Q_CODE_QUESTIONS[family] ?? ""
}

type SurveyCodeSortKey = { tier: 0 | 1 | 2; num: number; raw: string }

function surveyCodeSortKey(code: string): SurveyCodeSortKey {
  const raw = code.trim()
  if (!raw) return { tier: 2, num: 0, raw }
  const q = raw.match(/^QC?(\d+)/i)
  if (q) {
    const n = parseInt(q[1], 10)
    return { tier: 0, num: Number.isFinite(n) ? n : 0, raw }
  }
  const s = raw.match(/^S(\d+)/i)
  if (s) {
    const n = parseInt(s[1], 10)
    return { tier: 1, num: Number.isFinite(n) ? n : 0, raw }
  }
  return { tier: 2, num: 0, raw }
}

/**
 * Comparator for survey instrument codes: Q/QC numbers ascending, then S
 * numbers, then unknown shapes (locale order). Matrix-style codes like
 * `Q11r13oe` sort by their leading question number (11).
 */
export function compareSurveyQuestionCodesNumerically(a: string, b: string): number {
  const ka = surveyCodeSortKey(a)
  const kb = surveyCodeSortKey(b)
  if (ka.tier !== kb.tier) return ka.tier - kb.tier
  if (ka.tier !== 2 && kb.tier !== 2 && ka.num !== kb.num) return ka.num - kb.num
  return ka.raw.localeCompare(kb.raw, undefined, { sensitivity: "base" })
}

/** Stable numeric order for multi-question survey tooltips (e.g. Sources footer). */
export function sortSurveyQuestionCodesNumerically(codes: readonly string[]): string[] {
  return [...codes].sort(compareSurveyQuestionCodesNumerically)
}
