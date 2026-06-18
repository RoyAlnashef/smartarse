/**
 * Pure helpers for citation matching and filtering.
 *
 * Ported from the Disrupt citation-handoff bundle
 * (`agent-os/product/notes-archive/disrupt-mvp-citation-handoff/lib/citation-utils.ts`)
 * with only the imports adapted to smart-arse types. The matching algorithm
 * itself has been hardened across 30+ phases (P246, P254, P269, P273, P274,
 * P289c — see prefix comments below) so it is intentionally not rewritten
 * for this port.
 *
 * Used by:
 * - `lib/chat/interview-citation.tsx` — inline `[4]` Popover chunk match.
 * - `components/chat/chat-citation-sources-footer.tsx` — narrowing the
 *   bottom-chip `[4]` quotes dialog to the chunks that were actually cited.
 *
 * Only the helpers needed for the interview `[4]` flow are ported:
 * `findChunkByContext`, `filterCitedInterviewSources`, `extractLastQuote`,
 * `deepNormalize`. Survey verbatim matching (`findVerbatimByContext`) is
 * ported for the inline `[3]` popover flow.
 */

import type {
  ChatCitationSource,
  ChatInlineCitation,
  InterviewChunkData,
  SurveyChunkData,
} from "@/lib/types"

/** Normalise text for chunk matching: strip markdown punctuation, collapse whitespace. */
function baseNormalize(s: string): string {
  return s
    .replace(/[*_`~""\u201c\u201d]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/** Strip transcript disfluencies so AI-cleaned quotes still match raw chunk_preview. */
function stripDisfluencies(s: string): string {
  return s
    .replace(/\b(?:um+|uh+|er+|ah+|hmm+|like|you know|i mean|sort of|kind of|just)\b/g, " ")
    .replace(/\b\w+--+/g, " ")
    .replace(/--+/g, " ")
    .replace(/\.{2,}|…/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

/** Aggressive normalisation for anchor-phrase matching: strip disfluencies AND drop commas/semicolons. */
export function deepNormalize(s: string): string {
  return stripDisfluencies(baseNormalize(s))
    .replace(/[,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Extract the most recently quoted text from preceding content
 * (markdown blockquote `> "..."` or inline `"..."`). Returns null if not found.
 * G10 (P273): handles ASCII double quotes, smart double quotes (U+201C/U+201D),
 * smart single quotes (U+2018/U+2019), and ASCII single quotes. Single-quote
 * contractions inside the quoted text (e.g. "don't") don't terminate the match
 * because the regex consumes only one closing quote variant per group.
 */
export function extractLastQuote(precedingText: string): string | null {
  // P286b: 3-char floor avoids degenerate "" / "a" / "ok" matches but still
  // catches genuine short verbatims like "Kingdom Vision 2030" (19 chars) /
  // "TV" (2 chars). The previous 20-char floor caused [3] popovers to render
  // the second-last quote when the last one fell below 20 chars.
  const doubleMatches = [...precedingText.matchAll(/["\u201c]([^"\u201c\u201d\n]{3,})["\u201d]?/g)]
  if (doubleMatches.length > 0) {
    return doubleMatches[doubleMatches.length - 1][1].trim()
  }
  const singleMatches = [...precedingText.matchAll(/(?:^|[\s>—–-])['\u2018]([^'\u2018\u2019\n]{3,})['\u2019]?/g)]
  if (singleMatches.length > 0) {
    return singleMatches[singleMatches.length - 1][1].trim()
  }
  return null
}

/**
 * Given the raw text that immediately preceded a `[4]` citation marker,
 * find the interview chunk whose content most closely matches it.
 *
 * Three-tier strategy:
 *   Tier 1 (forward)  — chunk_preview START appears in clean text.
 *   Tier 2 (reverse)  — clean text START appears anywhere in chunk_preview.
 *   Tier 3 (demog.)   — parse country/gender/age from attribution line.
 *
 * Shared between the inline `[4]` popover (per-quote chunk match) and
 * `filterCitedInterviewSources` (bottom-chip drawer filtering).
 */
export function findChunkByContext(
  chunks: InterviewChunkData[] | null | undefined,
  precedingText: string
): InterviewChunkData | null {
  if (!chunks || !chunks.length || !precedingText) return null

  const clean = baseNormalize(precedingText)
  const cleanStripped = stripDisfluencies(clean)

  // P269 Tier 1.5 — quote-anchor: extract the last quoted text from `precedingText`
  // and match against chunk_preview AFTER aggressive disfluency-stripping on
  // BOTH sides. Catches the case where AI cleans filler from a chunk that has
  // interleaved noise.
  const aiQuote = extractLastQuote(precedingText)
  if (aiQuote && aiQuote.length >= 25) {
    const aiQuoteDeep = deepNormalize(aiQuote)
    const aiWords = aiQuoteDeep.split(/\s+/).filter((w) => w.length >= 3)
    if (aiQuoteDeep.length >= 25) {
      for (const chunk of chunks) {
        if (!chunk.chunk_preview) continue
        const previewDeep = deepNormalize(chunk.chunk_preview)
        if (previewDeep.includes(aiQuoteDeep) || aiQuoteDeep.includes(previewDeep)) {
          return chunk
        }
        if (aiWords.length >= 8) {
          const phrases: string[] = []
          for (let i = 0; i <= aiWords.length - 4; i++) {
            phrases.push(aiWords.slice(i, i + 4).join(" "))
          }
          const hits = phrases.filter((p) => previewDeep.includes(p)).length
          if (hits >= 2) return chunk
        }
      }
    }
  }

  // Tier 1: forward — chunk_preview start appears in preceding text.
  for (const len of [60, 30, 15]) {
    for (const chunk of chunks) {
      if (!chunk.chunk_preview) continue
      const previewNorm = baseNormalize(chunk.chunk_preview)
      const keyRaw = previewNorm.slice(0, len)
      const keyStripped = stripDisfluencies(keyRaw)
      for (const key of [keyRaw, keyStripped]) {
        if (key.length >= Math.min(len, 12)) {
          if (clean.includes(key) || cleanStripped.includes(key)) return chunk
        }
      }
    }
  }

  // Tier 2: reverse — preceding text start appears anywhere in chunk_preview.
  for (const len of [60, 40, 25]) {
    const candidates = [clean.slice(0, len).trim(), cleanStripped.slice(0, len).trim()]
    for (const cleanKey of candidates) {
      if (cleanKey.length < 12) continue
      for (const chunk of chunks) {
        if (!chunk.chunk_preview) continue
        const preview = baseNormalize(chunk.chunk_preview)
        const previewStripped = stripDisfluencies(preview)
        if (preview.includes(cleanKey) || previewStripped.includes(cleanKey)) {
          return chunk
        }
      }
    }
  }

  // Tier 3: demographic matching — `[4]` on an attribution line.
  // P254: accept en dash (\u2013) and em dash (\u2014) in age range — AI often
  // renders "25–34" not "25-34". Captured age string normalised to ASCII hyphen
  // for comparison with chunk.interview_age (which uses ASCII).
  const attrMatch = clean.match(
    /[—\-\(\[]\s*(uk|ksa)\s+(male|female|other)[,\s]+(\d+[-\u2013\u2014]\d+|\d+\+)/i
  )
  if (attrMatch) {
    const country = attrMatch[1].toUpperCase()
    const gender = attrMatch[2][0].toUpperCase() + attrMatch[2].slice(1).toLowerCase()
    const age = attrMatch[3].replace(/[\u2013\u2014]/g, "-")
    const withMod = chunks.filter(
      (c) =>
        c.interview_country === country &&
        c.interview_gender === gender &&
        c.interview_age === age &&
        c.moderator_question
    )
    if (withMod.length === 1) return withMod[0]
    if (withMod.length > 1) {
      const segMatch = clean.match(/concern\s+\d+\/10,\s*(.+)$/i)
      if (segMatch) {
        const segKey = segMatch[1].replace(/[\]\)]+$/, "").trim()
        const segFiltered = withMod.filter((c) =>
          c.interview_segment?.toLowerCase().includes(segKey)
        )
        if (segFiltered.length >= 1) return segFiltered[0]
      }
      return withMod[0]
    }
  }

  return null
}

/**
 * P271: locate the survey verbatim row whose `verbatim` text matches the AI's
 * preceding quote text. Mirrors `findChunkByContext` but for `[3]` markers.
 *
 * Used by the chip popover to render structurally-correct demographics
 * (Country + Gender + Age + Segment) sourced from the database, removing
 * the AI-prose dependency.
 *
 * Match strategy: deep-normalise both sides, then forward-substring match
 * (verbatim contains AI quote). Reverse direction with length sanity as
 * fallback. A third anchor-phrase fuzzy pass catches grammar-corrected quotes.
 */
export function findVerbatimByContext(
  verbatims: SurveyChunkData[],
  precedingText: string
): SurveyChunkData | null {
  if (!verbatims.length || !precedingText) return null

  const quoteText = extractLastQuote(precedingText) || precedingText
  const qDeep = deepNormalize(quoteText)

  if (qDeep.length >= 3) {
    for (const v of verbatims) {
      if (!v.verbatim) continue
      const vDeep = deepNormalize(v.verbatim)
      if (!vDeep) continue
      if (vDeep === qDeep) return v
      const englishIdx = (v.verbatim || "").indexOf("[English]:")
      if (englishIdx >= 0) {
        const vEng = deepNormalize(
          v.verbatim.slice(englishIdx + "[English]:".length)
        )
        if (vEng && vEng === qDeep) return v
      }
    }
  }

  if (qDeep.length < 20) return null

  for (const v of verbatims) {
    if (!v.verbatim) continue
    const vDeep = deepNormalize(v.verbatim)
    if (!vDeep) continue
    if (vDeep.includes(qDeep)) return v
  }

  for (const v of verbatims) {
    if (!v.verbatim) continue
    const vDeep = deepNormalize(v.verbatim)
    if (!vDeep) continue
    if (qDeep.includes(vDeep) && vDeep.length >= qDeep.length * 0.7) return v
  }

  const qWords = qDeep.split(/\s+/).filter((w) => w.length >= 3)
  if (qWords.length >= 8) {
    const phrases: string[] = []
    for (let i = 0; i <= qWords.length - 4; i++) {
      phrases.push(qWords.slice(i, i + 4).join(" "))
    }
    let best: { row: SurveyChunkData; hits: number } | null = null
    for (const v of verbatims) {
      if (!v.verbatim) continue
      const vDeep = deepNormalize(v.verbatim)
      if (!vDeep) continue
      if (vDeep.length < qDeep.length * 0.5 || vDeep.length > qDeep.length * 2.0) {
        continue
      }
      const hits = phrases.filter((p) => vDeep.includes(p)).length
      if (hits >= 2 && (!best || hits > best.hits)) {
        best = { row: v, hits }
      }
    }
    if (best) return best.row
  }

  return null
}

/**
 * Filter a sources array so the `[4]` interview source only contains chunks
 * that were actually cited inline (matched via `marker_position`).
 *
 * Intended to be called before passing sources to the footer so the dialog
 * shows only the cited quotes instead of the full IQL-retrieved set.
 *
 * Safe degradation: when fewer chunks match than there are `[4]` inline
 * markers, fills from the next-most-relevant unused chunks (IQL similarity
 * order) so drawer count always equals inline pill count. When no `[4]`
 * markers exist at all, suppresses the `[4]` source so the chip doesn't
 * appear (P289c-A / P289c-B).
 */
export function filterCitedInterviewSources(
  content: string,
  inlineCitations: ChatInlineCitation[] | null | undefined,
  sources: ChatCitationSource[]
): ChatCitationSource[] {
  // P289c-A: When inline_citations is missing entirely (older cache hits before
  // Format Cache Hit v1.6 propagated the field), we can't filter — but we can
  // still suppress the [4] chip when AI didn't cite [4] anywhere in `content`.
  if (!inlineCitations || inlineCitations.length === 0) {
    if (!/\[4\]/.test(content)) {
      return sources.filter((s) => s.index !== 4)
    }
    return sources
  }

  const source4 = sources.find((s) => s.index === 4)
  if (!source4 || !source4.interviewChunks?.length) return sources

  const cited4 = inlineCitations.filter((ic) => ic.sourceIndex === 4)
  if (cited4.length === 0) {
    // P289c-B: AI cited [1]/[2]/[3] but not [4]. The [4] source object is attached
    // (FCR injects interview pool unconditionally) but the chip would mislead users
    // by showing 50 unrelated chunks. Filter it out so [4] chip doesn't appear.
    return sources.filter((s) => s.index !== 4)
  }

  const matched = new Set<InterviewChunkData>()
  for (const ic of cited4) {
    const preceding = content.slice(
      Math.max(0, ic.marker_position - 200),
      ic.marker_position
    )
    const chunk = findChunkByContext(source4.interviewChunks, preceding)
    if (chunk) matched.add(chunk)
  }

  // P269b: graceful slice fallback ALWAYS runs — when fewer chunks matched than
  // inline pills (including the all-fail case where matched.size===0), fill from
  // the next-most-relevant unused chunks (IQL similarity order) so drawer count
  // always equals inline pill count.
  if (matched.size < cited4.length) {
    const needed = cited4.length - matched.size
    const unused = source4.interviewChunks.filter((c) => !matched.has(c))
    for (let i = 0; i < Math.min(needed, unused.length); i++) {
      matched.add(unused[i])
    }
  }

  if (matched.size === 0) return sources

  const citedChunks = [...matched]
  return sources.map((s) =>
    s.index === 4
      ? { ...s, interviewChunks: citedChunks, quoteCount: citedChunks.length }
      : s
  )
}
