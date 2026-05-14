# References for Interview Citation Popover and Modal

## Similar Implementations

### Prototype `CitationChip.tsx` (notes-archive)

- **Location:** [`agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx`](../../product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx)
- **Relevance:** This is the source-of-truth reference for the visual + interaction we're replicating. Two pieces are directly relevant:
  - **`InterviewQuotesDialog`** (L27-105) — the aggregated modal. Layout: `h-[80vh] max-w-lg` Dialog with a sticky header (`MessageSquareQuote` icon + "Interview Quotes (N)") and a `ScrollArea` body that iterates `interview_chunks_data`. Each row has: demographics row (segment badge via `getSegmentBadgeClasses` + country/gender/age), moderator question (only when `length >= 20`, prefixed with "Q:"), italic chunk preview in quotation marks.
  - **`InlineCitationChip`** interview branch (L300-360) — the inline Popover. Calls `findChunkByContext(chunks, precedingText)`. When matched and either moderator_question (≥20 chars) or chunk_preview (≥20 chars) exists, opens a small Popover (`w-80 p-3`) with: header (icon + "Moderator Question" or "Interview Quote"), the chunk text (clamped at 320 chars), demographics row. When no usable chunk, falls back to the same `InterviewQuotesDialog`.
- **Key patterns to borrow:**
  - Two distinct interaction tiers: per-chunk Popover for inline, aggregated Dialog for footer + inline-no-match fallback.
  - The 20-char floor on `moderator_question` (v1 MIXED chunks have no moderator question — the prototype's earlier behaviour fell through to the drawer on a valid match, which the L313 condition fixes).
  - Quote text clamp at 320 chars in the inline Popover.

### Citation handoff doc

- **Location:** [`agent-os/product/notes-archive/disrupt-mvp-citation-handoff/CITATION-HANDOFF.md`](../../product/notes-archive/disrupt-mvp-citation-handoff/CITATION-HANDOFF.md)
- **Relevance:** Backend payload contract. Confirms `sources[]` entry for `[4]` carries `interview_chunks_data` (with `respondent_id`, `interview_country|gender|age`, `segment_name`, `moderator_question`, `chunk_preview`, `similarity`) and `quote_count`. Section 5d documents the inline `[4]` matching strategy (preceding 200 chars → `findChunkByContext`). Section 6d documents the `filterCitedInterviewSources` step that narrows the bottom drawer to actually-cited chunks.

### Citation utils (notes-archive)

- **Location:** [`agent-os/product/notes-archive/disrupt-mvp-citation-handoff/lib/citation-utils.ts`](../../product/notes-archive/disrupt-mvp-citation-handoff/lib/citation-utils.ts)
- **Relevance:** Hardened matching helpers we will port verbatim. Key functions:
  - `findChunkByContext(chunks, precedingText)` — 3-tier matching (forward, reverse, demographic regex) with disfluency-stripped + quote-anchor fast paths.
  - `filterCitedInterviewSources(content, inlineCitations, sources)` — uses `inline_citations[i].marker_position` and `Math.max(0, ic.marker_position - 200)` slicing, with a graceful slice fallback so the drawer count always equals the inline pill count.
  - `extractLastQuote(precedingText)`, `deepNormalize`, `stripDisfluencies` — helpers used internally.
- **Caveat:** the file imports from a local `./types` shape (`Source`, `InterviewChunkData`, `SurveyChunkData`, `InlineCitation`) — port needs to retype against the in-app `ChatCitationSource` + new `InterviewChunkData` + `ChatInlineCitation`.

## In-app touch points (current state)

### Inline pill renderer (duplicated)

- **`components/chat/message-bubble.tsx`** L172-225 — dashboard chat bubble's `a` override that turns rewritten `[N]` markdown links into the Tooltip-trigger button.
- **`components/client/project-detail/project-chat.tsx`** L172-240 — client project chat's near-identical `a` override. Both need the interview branch.

### Footer chip renderer

- **`components/chat/chat-citation-sources-footer.tsx`** L67-105 — single component used by both bubbles. Currently every chip uses Radix Tooltip + `CitationTooltipBody`. The [4] branch must replace the Tooltip wrapper with a Dialog trigger.

### Type + parser

- **`lib/types.ts`** L154 — `ChatCitationSource` definition.
- **`lib/api/chat-payload.ts`** L55 (`parseCitationSource`) and L348 (`resultPayloadToClientShape`). Currently `interview_chunks_data` is dropped entirely; only `chunk_preview` is mined into the singular `excerpt` field at L82.

### Tooltip body (existing reference for layout patterns)

- **`lib/chat/citation-tooltip.tsx`** — `CitationTooltipBody` and helpers. We don't extend this for `[4]`; we render a dedicated Popover instead. The icon hint logic (`citationSourceIconHint` + `iconFromHint`) is reusable if we want consistent iconography across the new components.

### Inline citation utilities (existing)

- **`lib/chat/inline-citations.ts`** — `rewriteInlineCitationMarkers`, `parseCitationHref`, `resolveInlineCitation`. We will use `resolveInlineCitation` to find the `marker_position` for the matched inline citation row.

### UI primitives available

- `components/ui/popover.tsx` — Radix Popover (click trigger).
- `components/ui/dialog.tsx` — Radix Dialog.
- `components/ui/scroll-area.tsx` — Radix ScrollArea.
