# Handover survey citations (Phase 1) — plan

## Shaping decisions

- **Depth:** Phase 1 — survey focus only; keep existing Radix `Tooltip` + [`ChatCitationSourcesFooter`](../../../components/chat/chat-citation-sources-footer.tsx). Defer interview `[4]` drawer, `survey_chunks_data` verbatim UI, and handover `Popover`/`Dialog` patterns.
- **Question text:** **Hybrid** — prefer API `question_text` / `questionText` on the citation row when present; otherwise resolve wording from a static **`Q_CODE_QUESTIONS`** map keyed by Q code (and from `question_codes` / per-marker `q_codes` when the API omits prose).

## Why this is needed (gap summary)

| Handover ([`CitationChip.tsx`](../../product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/CitationChip.tsx)) | smart-arse today |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Source.question_codes[]` + per-marker `inline_citations[]` with `marker_position` + `q_codes` | [`ChatCitationSource`](../../../lib/types.ts) has single `questionCode`; no `question_codes`, no `inline_citations` on [`ChatMessage`](../../../lib/types.ts) |
| `Q_CODE_QUESTIONS[qCode]` for list UI | No `lib/survey-codes.ts` in app |
| Multiple `[3]` occurrences get **different** `q_codes` via stable `marker_position` matching | [`rewriteInlineCitationMarkers`](../../../components/client/project-detail/project-chat.tsx) turns every `[3]` into the same `citation://3` — **no per-occurrence identity** |

```mermaid
flowchart TB
  subgraph api [Disrupt payload]
    sources[sources with question_codes]
    ic[inline_citations]
  end
  subgraph client [smart-arse Phase 1]
    parse[parseCitationSource + parseInlineCitations]
    store[ThreadStoredMessage + ChatMessage]
    href[citation href with occurrence]
    tip[CitationTooltipBody + Q map fallback]
  end
  sources --> parse
  ic --> parse
  parse --> store
  store --> href
  href --> tip
```

## Product alignment

See [`agent-os/product/mission.md`](../../product/mission.md): MVP calls for **Disrupt’s AI/RAG API** with auditable, document-grounded answers. Parity with handover citation metadata reduces “same LLM, different tooltip” confusion and matches stakeholder demos.

## Standards to honour

- [`agent-os/standards/global/domain-data-layer.md`](../../standards/global/domain-data-layer.md) — extend `lib/types` + parsing in one place; keep JSON stored in `chat_results.result_payload` backward compatible.
- [`agent-os/standards/global/project-conventions.md`](../../standards/global/project-conventions.md) — `@/` imports, client boundaries, `cn()` for tooltip layout.

---

## Task 2: Types and API contract

- Add **`ChatInlineCitation`** in [`lib/types.ts`](../../../lib/types.ts): `sourceIndex: number` (generalize beyond handover’s `3 | 4`), `marker_position: number`, `q_codes: string[] | null`. Document snake_case aliases for n8n (`inline_citations`, `marker_position`, `q_codes`, `source_index` / `index`).
- Extend **`ChatCitationSource`**: `questionCodes?: string[] | null`; optional `sampleDescription`, `baseSize` (number | string) for footer “All Respondents, n=…” parity later if desired in tooltip.
- Extend **`ChatMessage`**: `inlineCitations?: ChatInlineCitation[] | null`.
- Extend **`ChatResultForClient`** in [`lib/api/chat-payload.ts`](../../../lib/api/chat-payload.ts): `inlineCitations: ChatInlineCitation[]`.

---

## Task 3: Parsing (`chat-payload.ts`)

- In **`parseCitationSource`**: parse `question_codes` / `questionCodes` (array of strings), normalize to trimmed `string[] | null`.
- Add **`normalizeInlineCitations(raw)`**: validate array, coerce numeric fields, sort by `marker_position` for deterministic consumption.
- **`resultPayloadToClientShape`**: attach `inlineCitations` from widened root (`inline_citations` / `inlineCitations`).

---

## Task 4: Thread persistence (critical for multi-turn)

Today [`ThreadStoredMessage`](../../../lib/chat-thread.ts) only stores `id`, `role`, `content`, `timestamp`; [`mergeJobIntoAnchorPayload`](../../../lib/chat-thread.ts) never copies `sources` / `inline_citations` onto each assistant row, and [`chatMessagesFromStoredResult`](../../../lib/chat-thread.ts) only backfills **the last** assistant with top-level `shape.sources`.

- Extend **`ThreadStoredMessage`** with optional `citations` and `inlineCitations` (JSON-serializable snapshots for that turn).
- **`mergeJobIntoAnchorPayload`**: set `citations` + `inlineCitations` on **new** assistant entries from `resultPayloadToClientShape(input.newResult)`; when synthesizing the **first** pair from `prev`, copy `citations` / `inlineCitations` from `resultPayloadToClientShape(prev)` onto that first assistant message so reopening history does not lose metadata.
- **`parseThreadArray`**: read optional fields into `ThreadStoredMessage`.
- **`chatMessagesFromStoredResult`**: map stored per-message `citations` / `inlineCitations` onto each `ChatMessage`; **fallback** for legacy rows: keep existing behaviour (attach top-level `shape.sources` to last assistant only when no per-message citations).
- **`threadMessagesForPayload`**: include `citations` / `inlineCitations` when present (even if currently unused by callers) so future saves stay lossless.

Audit any **client-side** code that constructs `arse_message_thread` JSON to ensure it forwards these fields when saving.

---

## Task 5: `lib/survey-codes.ts` (hybrid fallback)

- Add **`Q_CODE_QUESTIONS: Record<string, string>`** (or `Partial<Record<...>>`).
- **Seed strategy:** copy the map from the handover repo’s `lib/survey-codes.ts` if obtainable; otherwise bootstrap from instrument exports / product CSV and expand over time. Missing keys should degrade gracefully (empty string after code, same as handover).

---

## Task 6: Per-occurrence inline markers (`[n]`)

Implement a **left-to-right scan** of assistant `content` (before ReactMarkdown) that rewrites `[n]` into unique hrefs when `sourcesByIndex` has that index, e.g. **`citation://3?o=0`**, `?o=1`, … (or `citation://3/0` — pick one scheme and document it).

- Update **`citationIndexFromHref`** in [`project-chat.tsx`](../../../components/client/project-detail/project-chat.tsx) and [`message-bubble.tsx`](../../../components/chat/message-bubble.tsx) to return `{ index, occurrence }` or pass `occurrence` into tooltip props.
- **`MessageBubble` markdown `a` handler**: pass `occurrence` into a small resolver that picks the correct **`ChatInlineCitation`** row:
  - Filter `message.inlineCitations` where `sourceIndex === citationIndex` (and optionally match `marker_position` using the same tail+marker search strategy as handover only if needed; **Phase 1 can use sorted-by-`marker_position` list + `o` counter** if Disrupt guarantees `inline_citations` order matches visual `[n]` order — **document this contract**; if not, port a minimal `marker_position` resolver from [`MarkdownResponse.tsx`](../../product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/MarkdownResponse.tsx) later).

---

## Task 7: Tooltip UI (`citation-tooltip.tsx`)

For **survey** sources, align body with handover **`SourceCardContent`** survey branch:

- **`effectiveQCodes`**: `qCodesOverride` from resolved inline row **if** non-empty; else `source.questionCodes`; else single `questionCode` as a one-element list.
- **Rendering:**
  - `effectiveQCodes.length > 1` → nested panel + uppercase subtitle (“Survey questions cited here” vs “Multiple survey questions…” when override vs union — mirror handover copy).
  - `length === 1` → single block with **bold code + text** using `questionText` **or** `Q_CODE_QUESTIONS[code]`.
  - `length === 0` but `questionCode` → existing single-code path with hybrid text.
- Keep prior work: header `Survey Data (N=…)`, `Source type: survey` row if you still want metadata under the list, or fold metadata into the handover-style footer line only — **decide in implementation** to avoid duplicate “n=” noise; default: **prefer handover list + sample pill**, drop redundant rows when list is shown.

---

## Task 8: Verification

- **Unit tests** (recommended): `normalizeInlineCitations`, href rewrite counter, `buildSurveyTooltipRows` / effective Q-code merge, legacy thread fallback.
- **Manual:** multi-`[3]` answer with two different `q_codes` arrays in `inline_citations`; reload thread from Supabase and confirm tooltips differ per chip; confirm hybrid map fills when `question_text` absent.

---

## Explicitly out of scope (this phase)

- Interview quotes `Dialog`, `[4]` chip behaviour, `survey_chunks_data` / verbatim demographics UI.
- Replacing Radix `Tooltip` with shadcn `Popover` for survey only.
- Full port of `injectCitations` / `ConsumedMap` complexity unless Task 6 contract proves insufficient.
