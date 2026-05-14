# Handover survey citations (Phase 1) — shaping notes

## Scope

- **Phase 1 — survey only:** Match Disrupt handover behaviour for **survey** citation chips and tooltips. Keep the existing Radix `Tooltip` and [`ChatCitationSourcesFooter`](../../../components/chat/chat-citation-sources-footer.tsx).
- **Explicitly deferred:** Interview `[4]` drawer, `survey_chunks_data` verbatim UI, handover `Popover`/`Dialog` patterns for survey, and wholesale ports of `injectCitations` / `ConsumedMap` unless a later phase requires them.

## Question text (hybrid)

- Prefer API prose on the citation row when present: `question_text` / `questionText`.
- When absent, resolve wording from a static **`Q_CODE_QUESTIONS`** map keyed by Q code, using `question_codes` on the source and/or per-marker `q_codes` from `inline_citations` when the API omits prose.
- Missing map keys should degrade gracefully (empty string after the code), consistent with handover behaviour.

## Persistence and thread caveat

Citation metadata must survive **multi-turn** sessions and **reopened** threads:

- Today, stored thread rows can lose per-turn `sources` / `inline_citations` if only the latest assistant message is backfilled from the top-level result shape.
- Phase 1 implementation extends per-assistant snapshots (`citations`, `inlineCitations`) on stored messages and merge logic so hydration does not collapse repeated `[n]` tooltips to a single row’s metadata. Legacy rows without per-message fields keep a documented fallback (last assistant + top-level `sources`).

## Product alignment

MVP targets **Disrupt’s AI/RAG API** with auditable, document-grounded answers ([`agent-os/product/mission.md`](../../product/mission.md)). Parity on citation metadata reduces “same LLM, different tooltip” confusion and aligns stakeholder demos with the archived handover frontend.

## Related material in this folder

| File | Purpose |
| ---- | ------- |
| [`plan.md`](plan.md) | Full task breakdown (types, parsing, thread, markers, tooltip, verification). |
| [`references.md`](references.md) | Handover archive paths and current implementation files. |
| [`standards.md`](standards.md) | Domain layer and UI conventions excerpts. |
| [`visuals/`](visuals/) | Optional Disrupt screenshots for QA. |
