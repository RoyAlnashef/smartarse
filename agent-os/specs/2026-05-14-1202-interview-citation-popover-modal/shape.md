# Interview Citation Popover and Modal — Shaping Notes

## Scope

Source `[4]` (qualitative interview transcripts) citations currently render an almost-empty hover Tooltip ("Source type: interview" and nothing else). Match the reference prototype by:

1. Replacing the inline `[4]` pill's hover-Tooltip with a **click-Popover** that shows the specific interview chunk matched against the preceding answer text (moderator question or quote excerpt, segment badge, country / gender / age).
2. Replacing the footer `[4]` chip's hover-Tooltip with a **click-Dialog** that aggregates **all cited** interview chunks (segment badge, demographics, moderator Q, italic quote — for each chunk).
3. When inline `[4]` cannot match any chunk (e.g. AI placed the marker at the end of a section header), the click opens the same aggregated Dialog as fallback.

Scope is strictly `[4]`. Inline pills and footer chips for `[1]` / `[2]` / `[3]` are unchanged. Survey verbatim mode for `[3]` is **out of scope** even though it would benefit from the same plumbing.

## Decisions

- **Interaction model:** click-only for `[4]` (inline Popover, footer Dialog). Other citation types keep the existing Radix `Tooltip` hover behaviour.
- **Chunk matching:** reuse `ChatInlineCitation.marker_position` (already on the type) + `message.content` to slice `precedingText = content.slice(marker_position - 200, marker_position)` and feed it to a ported `findChunkByContext`.
- **Cited-only filtering on the footer:** port `filterCitedInterviewSources` so the modal shows only the ~3 chunks the AI actually cited, not the 50-chunk IQL retrieval pool.
- **No-match fallback:** inline click opens the aggregated `InterviewQuotesDialog` (prototype parity).
- **Reuse, do not rewrite:** `findChunkByContext`, `filterCitedInterviewSources`, `extractLastQuote`, `deepNormalize` are copied from the hardened notes-archive sources. Re-deriving the regex tiers and disfluency-stripping passes from scratch will introduce edge-case regressions.
- **Styling:** the pill keeps the existing `citeSourceIndexBadgeCn` token-driven badge styling; the Popover and Dialog use shadcn primitives + Tailwind tokens (`muted`, `border`, `foreground`) and `lucide-react` icons.

## Context

- **Visuals:**
  - `visuals/01-current-tooltip.png` — current "Source type: interview" Tooltip (the bug we're fixing).
  - `visuals/02-prototype-body-popover.png` — prototype's per-chunk Popover triggered from an inline `[4]` pill.
  - `visuals/03-prototype-footer-modal.png` — prototype's aggregated Dialog triggered from the footer `[4]` chip.
- **References:** see [`references.md`](references.md) — prototype `CitationChip.tsx`, citation handoff doc, current in-app touch points.
- **Product alignment:** the MVP product mission calls for auditable, document-grounded AI answers. Surfacing per-chunk attribution for interview citations is consistent with the parity work already done for survey citations.

## Standards Applied

- `agent-os/standards/global/domain-data-layer.md` — extend `lib/types.ts` + parsing in one place so the new `InterviewChunkData` field flows through `chat_results.result_payload` without breaking the back-compat path (sources without the field still parse cleanly).
- `agent-os/standards/global/project-conventions.md` — `@/` imports, `cn()` for class merging, client boundaries (`"use client"` on any file using Popover/Dialog state).
- `agent-os/standards/css/ui-styling.md` — compose from `components/ui/*` (Popover, Dialog, ScrollArea) rather than reinventing primitives; `lucide-react` for icons; `cn()` from `@/lib/utils`.

## Open questions

None outstanding for this spec. All clarifications captured during shaping:

- **Inline `[4]` interaction:** click-only Popover (confirmed by user).
- **Inline `[4]` no-match fallback:** open the same aggregated modal (confirmed by user).
