/**
 * Inline citation marker rewriting and href parsing.
 *
 * Phase 1 of the handover survey citations spec rewrites bare `[n]` markers in
 * assistant content into clickable links so each occurrence carries a
 * **per-occurrence** identity. This lets a single answer with multiple `[3]`
 * markers attribute different `q_codes` to each chip.
 *
 * Href scheme: `citation://<index>?o=<occurrence>` where `occurrence` is the
 * **zero-based ordinal** of the marker within all `[<index>]` matches in the
 * same content (left-to-right). The query-string form was chosen over a path
 * variant (`citation://3/0`) so additional metadata can be appended later
 * without ambiguity.
 *
 * Resolution contract for `inline_citations`: when the assistant payload
 * provides `inline_citations`, it is sorted by `marker_position` ascending in
 * `normalizeInlineCitations`. For Phase 1 we assume Disrupt emits
 * `inline_citations` in the same order the `[n]` markers appear visually,
 * so resolving the Nth occurrence of `[k]` simply takes the Nth row whose
 * `sourceIndex === k`. If a project surfaces ordering mismatches we will
 * port the handover `marker_position` text-search resolver (see
 * `agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/MarkdownResponse.tsx`).
 */

import type { ChatCitationSource, ChatInlineCitation } from "@/lib/types"

export const CITATION_HREF_PREFIX = "citation://"
export const CITATION_HREF_PATH_PREFIX = "/__citation__/"

/** Build a per-occurrence href; `occurrence` is 0-based. */
export function citationHref(index: number, occurrence: number = 0): string {
  if (!Number.isFinite(occurrence) || occurrence <= 0) {
    return `${CITATION_HREF_PATH_PREFIX}${index}`
  }
  return `${CITATION_HREF_PATH_PREFIX}${index}?o=${occurrence}`
}

export type CitationHrefParts = {
  index: number
  /** Zero-based; absent or `0` when the marker is the only `[index]` in the answer. */
  occurrence: number
}

/**
 * Parse a `citation://...` href into its index + occurrence parts.
 * Tolerates legacy hrefs without the `?o=` suffix (occurrence defaults to 0).
 */
export function parseCitationHref(
  href: string | undefined
): CitationHrefParts | null {
  if (!href) return null
  let tail: string
  if (href.startsWith(CITATION_HREF_PATH_PREFIX)) {
    tail = href.slice(CITATION_HREF_PATH_PREFIX.length)
  } else if (href.startsWith(CITATION_HREF_PREFIX)) {
    // Back-compat for already-rendered / legacy hrefs.
    tail = href.slice(CITATION_HREF_PREFIX.length)
  } else {
    return null
  }
  const [indexPart, queryPart = ""] = tail.split("?")
  const index = Number(indexPart)
  if (!Number.isInteger(index) || index < 1) return null

  let occurrence = 0
  if (queryPart) {
    const params = new URLSearchParams(queryPart)
    const raw = params.get("o")
    if (raw != null) {
      const parsed = Number(raw)
      if (Number.isFinite(parsed) && parsed >= 0) occurrence = Math.floor(parsed)
    }
  }
  return { index, occurrence }
}

/** Back-compat helper: index only, ignoring the occurrence. */
export function citationIndexFromHref(href: string | undefined): number | null {
  return parseCitationHref(href)?.index ?? null
}

/**
 * Rewrite `[n]` markers (excluding `[n](...)` markdown links) into
 * `[\[n\]](citation://n?o=k)`, where `k` is the running 0-based count of
 * `[n]` occurrences for the same `n`. Markers whose index isn't in
 * `sourcesByIndex` are left untouched.
 */
export function rewriteInlineCitationMarkers(
  markdown: string,
  sourcesByIndex: Map<number, ChatCitationSource>
): string {
  if (!markdown || sourcesByIndex.size === 0) return markdown
  const occurrences = new Map<number, number>()
  return markdown.replace(/\[(\d+)\](?!\()/g, (fullMatch, indexRaw: string) => {
    const index = Number(indexRaw)
    if (!sourcesByIndex.has(index)) return fullMatch
    const occurrence = occurrences.get(index) ?? 0
    occurrences.set(index, occurrence + 1)
    // Use bracket HTML entities in link text so react-markdown emits a real link
    // href (not an empty reference-style href), while still rendering as `[n]`.
    return `[&#91;${index}&#93;](${citationHref(index, occurrence)})`
  })
}

/**
 * Pick the inline-citation row that corresponds to the Nth occurrence of
 * `[sourceIndex]`. Filters `inlineCitations` (already sorted by
 * `marker_position` if it came through `normalizeInlineCitations`) and
 * returns the row at position `occurrence`.
 *
 * Returns `null` when the message has no `inlineCitations`, when no rows
 * match the index, or when the requested occurrence is out of range.
 */
export function resolveInlineCitation(
  inlineCitations: ChatInlineCitation[] | null | undefined,
  sourceIndex: number,
  occurrence: number
): ChatInlineCitation | null {
  if (!inlineCitations || inlineCitations.length === 0) return null
  const matches = inlineCitations.filter((row) => row.sourceIndex === sourceIndex)
  if (matches.length === 0) return null
  return matches[occurrence] ?? null
}

/**
 * Count bare `[n]` markers for a given index (excludes `[n](...)` markdown links).
 * Matches the convention used by {@link rewriteInlineCitationMarkers}.
 */
export function countBareCitationMarkersForIndex(
  markdown: string | null | undefined,
  sourceIndex: number
): number {
  if (!markdown || !Number.isInteger(sourceIndex) || sourceIndex < 1) return 0
  const re = new RegExp(`\\[${sourceIndex}\\](?!\\()`, "g")
  return markdown.match(re)?.length ?? 0
}

function trimNonEmptyCode(code: string | null | undefined): string | null {
  if (code == null) return null
  const t = code.trim()
  return t ? t : null
}

/**
 * Build a synthetic {@link ChatInlineCitation} for the Sources footer so survey
 * tooltips show the union of `q_codes` from inline rows that correspond to visible
 * `[sourceIndex]` markers only (first N rows for that index, N = marker count).
 * Returns `null` when there is nothing to narrow (fallback: `source.questionCodes`).
 */
export function buildFooterSurveySyntheticInlineCitation(
  sourceIndex: number,
  messageContent: string | null | undefined,
  inlineCitations: ChatInlineCitation[] | null | undefined
): ChatInlineCitation | null {
  if (!inlineCitations || inlineCitations.length === 0) return null
  const markerCount = countBareCitationMarkersForIndex(messageContent, sourceIndex)
  if (markerCount <= 0) return null

  const rowsForSource = inlineCitations.filter((row) => row.sourceIndex === sourceIndex)
  if (rowsForSource.length === 0) return null

  const slice = rowsForSource.slice(0, markerCount)
  const seen = new Set<string>()
  const merged: string[] = []
  for (const row of slice) {
    const codes = row.q_codes
    if (!codes?.length) continue
    for (const c of codes) {
      const t = trimNonEmptyCode(c)
      if (!t || seen.has(t)) continue
      seen.add(t)
      merged.push(t)
    }
  }
  if (merged.length === 0) return null

  return {
    sourceIndex,
    marker_position: 0,
    q_codes: merged,
    questionText: null,
  }
}
