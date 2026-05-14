import type { Source, InterviewChunkData, SurveyChunkData, InlineCitation } from "./types";

const CITATION_MARKER_RE = /\[(\d+)\]/g;

export type TextSegment = { type: "text"; value: string };
/** precedingText = the raw text in this markdown node immediately before the [N] marker */
export type CitationSegment = { type: "citation"; index: number; precedingText: string };
export type Segment = TextSegment | CitationSegment;

/**
 * Split a string around `[N]` citation markers.
 * Returns an array of text and citation segments.
 * Each CitationSegment carries the raw text that immediately preceded it within
 * the same markdown node — used by InlineCitationChip to match the specific
 * interview chunk that prompted the surrounding quote.
 */
export function parseInlineCitations(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(CITATION_MARKER_RE)) {
    const matchStart = match.index!;
    const precedingText = text.slice(lastIndex, matchStart);
    if (matchStart > lastIndex) {
      segments.push({ type: "text", value: precedingText });
    }
    segments.push({ type: "citation", index: parseInt(match[1], 10), precedingText });
    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

/** Runtime guard to filter invalid source objects from n8n response */
export function isValidSource(s: unknown): s is Source {
  if (!s || typeof s !== "object") return false;
  const obj = s as Record<string, unknown>;
  return typeof obj.index === "number" && typeof obj.filename === "string";
}

/* ── Interview chunk matching helpers ────────────────────────────────── */

/** Normalise text for chunk matching: strip markdown punctuation, collapse whitespace */
function baseNormalize(s: string): string {
  return s
    .replace(/[*_`~""\u201c\u201d]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Strip transcript disfluencies so AI-cleaned quotes still match raw chunk_preview */
function stripDisfluencies(s: string): string {
  return s
    .replace(/\b(?:um+|uh+|er+|ah+|hmm+|like|you know|i mean|sort of|kind of|just)\b/g, " ")
    .replace(/\b\w+--+/g, " ") // word fragments e.g. "sustain--", "I'm a sole--"
    .replace(/--+/g, " ")
    .replace(/\.{2,}|…/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Aggressive normalisation for anchor-phrase matching: strip disfluencies AND drop commas/semicolons */
function deepNormalize(s: string): string {
  return stripDisfluencies(baseNormalize(s))
    .replace(/[,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract the most recently quoted text from preceding content
 *  (markdown blockquote `> "..."` or inline `"..."`). Returns null if not found.
 *  G10 (P273): handles ASCII double quotes, smart double quotes (U+201C/U+201D),
 *  smart single quotes (U+2018/U+2019), and ASCII single quotes. Single-quote
 *  contractions inside the quoted text (e.g. "don't") don't terminate the match
 *  because the regex consumes only one closing quote variant per group. */
export function extractLastQuote(precedingText: string): string | null {
  // Strategy: try double-quote variants first (most common in AI output);
  // fall back to single-quote variants if no double-quoted match found.
  // Smart quotes: U+201C " (left double), U+201D " (right double),
  //               U+2018 ' (left single), U+2019 ' (right single).
  //
  // P286b: minimum length lowered from {20,} to {3,}. The previous floor
  // skipped genuine short verbatims (e.g. "Kingdom Vision 2030" = 19 chars,
  // "TV" = 2 chars) — when the LAST quote in precedingText fell below 20
  // chars, this returned the SECOND-LAST quote instead, causing the [3]
  // popover to show the wrong quote's text + demographics. Surfaced 2026-04-27
  // chat 4193: marker after "Kingdom Vision 2030" rendered Quote 2's data
  // ("Yes, we know that resources on Earth are starting to run out.").
  // 3-char floor avoids degenerate "" / "a" / "ok" matches.
  const doubleMatches = [...precedingText.matchAll(/["“]([^"“”\n]{3,})["”]?/g)];
  if (doubleMatches.length > 0) {
    return doubleMatches[doubleMatches.length - 1][1].trim();
  }
  const singleMatches = [...precedingText.matchAll(/(?:^|[\s>—–-])['‘]([^'‘’\n]{3,})['’]?/g)];
  if (singleMatches.length > 0) {
    return singleMatches[singleMatches.length - 1][1].trim();
  }
  return null;
}

/**
 * Given the raw text that immediately preceded a [4] citation marker,
 * find the interview chunk whose content most closely matches it.
 *
 * Three-tier strategy:
 *   Tier 1 (forward)  — chunk_preview START appears in clean text.
 *   Tier 2 (reverse)  — clean text START appears anywhere in chunk_preview.
 *   Tier 3 (demog.)   — parse country/gender/age from attribution line.
 *
 * Shared between CitationChip (per-quote popover) and filterCitedInterviewSources
 * (bottom CitationBar filtering).
 */
export function findChunkByContext(
  chunks: InterviewChunkData[],
  precedingText: string
): InterviewChunkData | null {
  if (!chunks.length || !precedingText) return null;

  const clean = baseNormalize(precedingText);
  const cleanStripped = stripDisfluencies(clean);

  // P269 Tier 1.5 — quote-anchor: extract the last quoted text from `precedingText` and
  // match it against chunk_preview AFTER aggressive disfluency-stripping on BOTH sides.
  // Catches the case where AI cleans filler from a chunk that has interleaved noise
  // (e.g. AI quotes "I simply argue, I'm not the sole responsible" but chunk preview
  // is "Uh, I simply argue like, uh, like I'm a sole-- I'm not the sole responsible").
  const aiQuote = extractLastQuote(precedingText);
  if (aiQuote && aiQuote.length >= 25) {
    const aiQuoteDeep = deepNormalize(aiQuote);
    const aiWords = aiQuoteDeep.split(/\s+/).filter((w) => w.length >= 3);
    if (aiQuoteDeep.length >= 25) {
      for (const chunk of chunks) {
        if (!chunk.chunk_preview) continue;
        const previewDeep = deepNormalize(chunk.chunk_preview);
        // (a) bidirectional substring match after deep-normalisation
        if (previewDeep.includes(aiQuoteDeep) || aiQuoteDeep.includes(previewDeep)) {
          return chunk;
        }
        // (b) anchor-phrase fragment: ≥2 distinct 4-word phrases from AI quote in chunk
        if (aiWords.length >= 8) {
          const phrases: string[] = [];
          for (let i = 0; i <= aiWords.length - 4; i++) {
            phrases.push(aiWords.slice(i, i + 4).join(" "));
          }
          const hits = phrases.filter((p) => previewDeep.includes(p)).length;
          if (hits >= 2) return chunk;
        }
      }
    }
  }

  // Tier 1: forward — chunk_preview start appears in preceding text
  for (const len of [60, 30, 15]) {
    for (const chunk of chunks) {
      if (!chunk.chunk_preview) continue;
      const previewNorm = baseNormalize(chunk.chunk_preview);
      const keyRaw = previewNorm.slice(0, len);
      const keyStripped = stripDisfluencies(keyRaw);
      for (const key of [keyRaw, keyStripped]) {
        if (key.length >= Math.min(len, 12)) {
          if (clean.includes(key) || cleanStripped.includes(key)) return chunk;
        }
      }
    }
  }

  // Tier 2: reverse — preceding text start appears anywhere in chunk_preview
  for (const len of [60, 40, 25]) {
    const candidates = [clean.slice(0, len).trim(), cleanStripped.slice(0, len).trim()];
    for (const cleanKey of candidates) {
      if (cleanKey.length < 12) continue;
      for (const chunk of chunks) {
        if (!chunk.chunk_preview) continue;
        const preview = baseNormalize(chunk.chunk_preview);
        const previewStripped = stripDisfluencies(preview);
        if (preview.includes(cleanKey) || previewStripped.includes(cleanKey)) {
          return chunk;
        }
      }
    }
  }

  // Tier 3: demographic matching — [4] on an attribution line
  // P254: accept en dash (\u2013) and em dash (\u2014) in age range — AI often renders "25–34" not "25-34".
  // Captured age string normalised to ASCII hyphen for comparison with chunk.interview_age (which uses ASCII).
  const attrMatch = clean.match(
    /[—\-\(\[]\s*(uk|ksa)\s+(male|female|other)[,\s]+(\d+[-\u2013\u2014]\d+|\d+\+)/i
  );
  if (attrMatch) {
    const country = attrMatch[1].toUpperCase();
    const gender = attrMatch[2][0].toUpperCase() + attrMatch[2].slice(1).toLowerCase();
    const age = attrMatch[3].replace(/[\u2013\u2014]/g, "-");
    const withMod = chunks.filter(
      (c) =>
        c.interview_country === country &&
        c.interview_gender === gender &&
        c.interview_age === age &&
        c.moderator_question
    );
    if (withMod.length === 1) return withMod[0];
    if (withMod.length > 1) {
      const segMatch = clean.match(/concern\s+\d+\/10,\s*(.+)$/i);
      if (segMatch) {
        const segKey = segMatch[1].replace(/[\]\)]+$/, "").trim();
        const segFiltered = withMod.filter((c) =>
          c.interview_segment?.toLowerCase().includes(segKey)
        );
        if (segFiltered.length >= 1) return segFiltered[0];
      }
      return withMod[0];
    }
  }

  return null;
}

/**
 * P271: locate the survey verbatim row whose `verbatim` text matches the AI's
 * preceding quote text. Mirrors `findChunkByContext` but for `[3]` markers.
 *
 * Used by the chip popover to render structurally-correct demographics
 * (Country + Gender + Age + Segment) sourced from the database, removing
 * the AI-prose dependency that P270b/c only partially closed (~46%).
 *
 * Match strategy: deep-normalise both sides (lowercase + strip filler +
 * strip ALL punctuation incl. periods + collapse whitespace), then
 * forward-substring match (verbatim contains AI quote — natural direction
 * since SVL rows often wrap English in `[Arabic]\n\n[English]:` prefix).
 * Reverse direction with length sanity as fallback. P272b adds a third
 * anchor-phrase fuzzy pass to catch cases where the AI silently grammar-corrected
 * the verbatim ("creative" → "creating", "Skill labour" → "skilled labour")
 * — single-character drift breaks substring but most 4-word phrases still match.
 * Constraint #43 (P272a) is the primary fix; P272b is defence-in-depth.
 */
export function findVerbatimByContext(
  verbatims: SurveyChunkData[],
  precedingText: string
): SurveyChunkData | null {
  if (!verbatims.length || !precedingText) return null;

  // Try to extract the most recent quoted text from preceding context first
  const quoteText = extractLastQuote(precedingText) || precedingText;
  const qDeep = deepNormalize(quoteText);

  // P286: Pass 0 — exact full-string match (no length threshold).
  // The existing 20-char guard prevents Pass 1/2/3 substring/anchor matches from
  // false-positive on very short content. But a DB row that EXACTLY equals the AI
  // quote IS the match, regardless of length. Q21 has many genuine short verbatims
  // ("Using solar energy", "Charity Association", "TV", "Recycling") that were
  // previously falling to the P274f "demographics not available" fallback because
  // qDeep.length < 20 made findVerbatimByContext bail before the substring loop.
  // This pass also handles the bilingual `[English]: ...` format from KSA rows.
  if (qDeep.length >= 3) {
    for (const v of verbatims) {
      if (!v.verbatim) continue;
      const vDeep = deepNormalize(v.verbatim);
      if (!vDeep) continue;
      if (vDeep === qDeep) return v;
      // Bilingual rows: try the English-only portion as well
      const englishIdx = (v.verbatim || "").indexOf("[English]:");
      if (englishIdx >= 0) {
        const vEng = deepNormalize(v.verbatim.slice(englishIdx + "[English]:".length));
        if (vEng && vEng === qDeep) return v;
      }
    }
  }

  // Length guard for Pass 1/2/3 (substring + anchor matches): these tolerate
  // partial overlaps so the 20-char floor is required to avoid false positives.
  if (qDeep.length < 20) return null;

  // Pass 1: forward — verbatim contains AI quote (true direction)
  for (const v of verbatims) {
    if (!v.verbatim) continue;
    const vDeep = deepNormalize(v.verbatim);
    if (!vDeep) continue;
    if (vDeep.includes(qDeep)) return v;
  }

  // Pass 2: reverse with length sanity (avoids spurious short-row matches)
  for (const v of verbatims) {
    if (!v.verbatim) continue;
    const vDeep = deepNormalize(v.verbatim);
    if (!vDeep) continue;
    if (qDeep.includes(vDeep) && vDeep.length >= qDeep.length * 0.7) return v;
  }

  // Pass 3 (P272b — anchor-phrase fuzzy): when AI's grammar-correction breaks
  // direct substring (e.g. "creative" vs "creating", "Skill labour" vs "skilled
  // labour"), ≥2 distinct 4-word anchor phrases from the AI quote should still
  // appear in the source verbatim. Length sanity required to avoid false positives.
  const qWords = qDeep.split(/\s+/).filter((w) => w.length >= 3);
  if (qWords.length >= 8) {
    const phrases: string[] = [];
    for (let i = 0; i <= qWords.length - 4; i++) {
      phrases.push(qWords.slice(i, i + 4).join(" "));
    }
    let best: { row: SurveyChunkData; hits: number } | null = null;
    for (const v of verbatims) {
      if (!v.verbatim) continue;
      const vDeep = deepNormalize(v.verbatim);
      if (!vDeep) continue;
      // length sanity: source verbatim within ±50% of AI quote length
      if (vDeep.length < qDeep.length * 0.5 || vDeep.length > qDeep.length * 2.0) continue;
      const hits = phrases.filter((p) => vDeep.includes(p)).length;
      if (hits >= 2 && (!best || hits > best.hits)) {
        best = { row: v, hits };
      }
    }
    if (best) return best.row;
  }

  return null;
}

/**
 * Filter a sources array so the [4] interview source only contains chunks
 * that were actually cited inline (matched via marker_position).
 *
 * Intended to be called before passing sources to CitationBar so the drawer
 * shows only the cited quotes instead of the full IQL-retrieved set.
 *
 * Safe degradation: if no chunks can be matched, returns the original sources
 * array unchanged (all chunks visible as before).
 */
export function filterCitedInterviewSources(
  content: string,
  inlineCitations: InlineCitation[] | undefined,
  sources: Source[]
): Source[] {
  // P289c-A: When inline_citations is missing entirely (e.g. older cache hits before
  // Format Cache Hit v1.6 propagated the field), we can't filter — but we can still
  // suppress the [4] chip since we have no evidence AI cited interview data. This
  // prevents the bottom CitationBar drawer showing the full 50-chunk IQL pool when
  // AI didn't reference any [4] in the answer text.
  if (!inlineCitations || inlineCitations.length === 0) {
    // Best-effort: scan content for [4] markers — if none, drop [4] source
    if (!/\[4\]/.test(content)) return sources.filter((s) => s.index !== 4);
    return sources;
  }

  const source4 = sources.find((s) => s.index === 4);
  if (!source4 || !source4.interview_chunks_data?.length) return sources;

  const cited4 = inlineCitations.filter((ic) => ic.index === 4);
  if (cited4.length === 0) {
    // P289c-B: AI cited [1]/[2]/[3] but not [4]. The [4] source object is attached
    // (FCR injects interview pool unconditionally) but the chip would mislead users
    // by showing 50 unrelated chunks. Filter it out so [4] chip doesn't appear at all.
    return sources.filter((s) => s.index !== 4);
  }

  // Use Set<object> — deduplicates by reference since findChunkByContext returns
  // objects from the original array. Handles duplicate matches gracefully.
  const matched = new Set<InterviewChunkData>();
  for (const ic of cited4) {
    const preceding = content.slice(
      Math.max(0, ic.marker_position - 200),
      ic.marker_position
    );
    const chunk = findChunkByContext(source4.interview_chunks_data, preceding);
    if (chunk) matched.add(chunk);
  }

  // P269b: graceful slice fallback ALWAYS runs — when fewer chunks matched than
  // inline pills (including the all-fail case where matched.size===0), fill from
  // the next-most-relevant unused chunks (IQL similarity order) so drawer count
  // always equals inline pill count. P269 v1 had an early-return on matched.size===0
  // that bypassed the slice in the most common failure case.
  if (matched.size < cited4.length) {
    const needed = cited4.length - matched.size;
    const unused = source4.interview_chunks_data.filter((c) => !matched.has(c));
    for (let i = 0; i < Math.min(needed, unused.length); i++) {
      matched.add(unused[i]);
    }
  }

  // Final safety: if cited4 was empty (no [4] markers at all), fall back to original
  if (matched.size === 0) return sources;

  const citedChunks = [...matched];
  return sources.map((s) =>
    s.index === 4
      ? { ...s, interview_chunks_data: citedChunks, quote_count: citedChunks.length }
      : s
  );
}
