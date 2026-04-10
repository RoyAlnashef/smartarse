# Summary: `chat_results` (Supabase sample)

This document summarizes the **`chat_results`** table as represented in the sample export [`chat_results_rows.csv`](./chat_results_rows.csv). The data comes from Disrupt’s testing of **smartARSE**; it is **not** wired into this repository (no `chat_results` references in the smart-arse codebase).

---

## What each row represents

Each row is the outcome of **one chat request** (one user question and the system’s structured response).

| Column             | Role                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| `id`               | Surrogate primary key.                                                        |
| `request_id`       | UUID for that request; can align with fields inside `result_payload`.         |
| `organization_id`  | Tenant / org scope. The sample uses a single org UUID throughout.             |
| `user_query`       | The user’s question (export may include embedded newlines).                   |
| `status`           | Lifecycle (e.g. `complete`). See **Data quality** below.                      |
| `result_payload`   | JSON document: assistant output plus execution metadata.                      |
| `created_at`       | When the row was written.                                                     |
| `query_embedding`  | Often populated with a vector string (semantic cache, retrieval, or routing). |
| `cache_hit_count`  | Cache usage counter; sample rows show `0`.                                    |
| `is_cacheable`     | Whether the response is treated as cacheable.                                 |
| `weighted`         | Whether weighted survey logic applies; duplicated inside `result_payload`.    |
| `data_source_mode` | `reports_only` vs `survey_only`; duplicated inside `result_payload`.          |
| `user_id`          | Optional user link; empty in the sample.                                      |
| `system_version`   | Backend version stamped on results (e.g. `10.65`).                            |

**Mental model:** one DB row ≈ **one pipeline run** for one question, with enough metadata to debug, replay, and version behaviour.

---

## How the chat works (from `route` and payload)

The assistant is **not** a single generic completion. It uses a **router**: the chosen handler is stored as **`route`** inside `result_payload`.

Observed routes in the sample:

| Route                       | Inferred behaviour                                                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REPORT_FIRST_SQL_FALLBACK` | **Main path** (most rows). Name suggests: **report / RAG-style** answering first, then **SQL or similar structured data** as fallback. Answers often cite **question codes (Q4, Q8, …)**, **weighted n**, and **document + survey sources**. |
| `GEOGRAPHY_REFUSAL`         | Guardrail: geography outside **UK and KSA**; short templated reply. Typically **`tool_calls_used`: 0**, empty `sources`.                                                                                                                     |
| `OUT_OF_SCOPE_TASK`         | Off-topic tasks (coding, weather, general knowledge). Uses **`response`** instead of **`answer`**, with flags like **`_isBypass`** and **`sessionId`** — likely an **early exit** before the main agent loop.                                |
| `METHODOLOGY_DEFENCE`       | Answers about **research methodology** using the study’s framing (sample design, weighting, segments, mixed methods).                                                                                                                        |
| `SEGMENT_DISPLAY`           | **Structured output** for the four audience segments (tables, metrics by segment).                                                                                                                                                           |
| `PROVENANCE_META`           | Sensitive provenance: defers detailed methodology to the Disrupt team; may still attach a **`survey`** source. **`tool_calls_used`** can be `1`.                                                                                             |

**Tooling:** `tool_calls_used` is **0** for trivial refusals and **1+** when the system runs quant / tool steps against the survey workbook.

---

## `result_payload` structure (typical keys)

Besides `route`, payloads commonly include:

- **`answer`** — main narrative (markdown-style headings in the text). Some bypass routes use **`response`** instead.
- **`sources`** — array of **`document`** (PDFs, decks, reports) and/or **`survey`** entries: `filename`, `chunk_preview`, `document_title`, `record_manager_id`, sometimes `variables_used`, `sample_size`.
- **`weighted`**, **`visualizations`** (often empty arrays in the sample), **`tool_calls_used`**, **`data_source_mode`**.
- **`low_base_warning`** — when answers flag small bases or caution in the prose.

Narrative answers often use **numeric citations** (`[1]`, `[2]`) aligned with `sources`.

---

## `data_source_mode`

Row-level values in the sample split roughly **reports vs survey** (e.g. `reports_only` and `survey_only`). That points to a **configured mode** (product or environment) for whether grounding favours **published materials** or the **quantitative survey file**, not something inferred only from free text.

---

## Data quality caveat

Some rows in the export show **`status` = `complete`** but an **empty `result_payload`** while `user_query` is present. Treat that as **incomplete or placeholder data** (async write not yet persisted, export timing, or a bug) — not evidence of an empty model reply. For analytics, require a **non-empty `result_payload`** (or a dedicated “failed / pending” status) before treating a turn as finished.

---

## Sample statistics (parsed from this CSV)

Approximate route counts from one parse of the file: `REPORT_FIRST_SQL_FALLBACK` dominates; smaller counts for `GEOGRAPHY_REFUSAL`, `OUT_OF_SCOPE_TASK`, `METHODOLOGY_DEFENCE`, `SEGMENT_DISPLAY`, `PROVENANCE_META`. Row-level `data_source_mode` in the same parse was split between `reports_only` and `survey_only`. Re-run counts if the export changes.

---

## Using this for smart-arse / UI

This table is a useful **contract** for chat history or replay: `request_id`, `user_query`, `created_at`, denormalized flags (`weighted`, `data_source_mode`, `system_version`), and a JSON payload that already separates **`route`**, **`answer`/`response`**, and **`sources`**. Align sidebar or history views with those fields as needed (see `agent-os/product/dev-notes/chat-history-spec.md`)
