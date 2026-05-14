# Citation System — Frontend / Backend Handoff

> **Purpose:** Everything the frontend dev needs to replicate the citation chips ([1], [2], [3], [4]) end-to-end — payload shape, render logic, file dependencies.
>
> **Generated:** 2026-05-09

---

## 1. The Big Picture

When a user asks a question, the AI responds with markdown text that contains inline citation markers like `[1]`, `[2]`, `[3]`, `[4]`. Each marker becomes a clickable pill in the chat. Below the answer, a "Sources" bar shows one chip per source used.

There are **two render targets per citation index:**

| Target | Where it appears | When user interacts |
|---|---|---|
| **Inline pill** | Right after the fact, in the middle of the answer text | Hover/click → small popover with specific source detail |
| **Bottom chip** | In the "Sources" bar below the answer | Click → expanded source panel with rolled-up info |

**Citation indices and what they mean:**

| Index | Source type | Mode |
|---|---|---|
| `[1]` | DHS Sustainability Research Report | Figure mode only |
| `[2]` | Sustainability White Paper (IRT/implicit attitudes) | Figure mode only |
| `[3]` | Survey Data (1,008 respondents) | Figure mode OR verbatim mode |
| `[4]` | Qualitative Interview Transcripts | Verbatim mode only |

**Mode definitions:**
- **Figure mode** = AI cited a statistic ("47% of UK respondents say cost is a barrier [3]"). Popover shows aggregate metadata.
- **Verbatim mode** = AI quoted a specific person ("\"Using less, putting more back in...\" [3]"). Popover shows that specific person's quote + demographics.

---

## 2. The Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User types question in chat                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend → POST /api/n8n with chat payload               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend (n8n workflow) processes:                        │
│    - AI Agent retrieves data + writes answer with [N]       │
│    - Format Chart Response enriches sources                 │
│    - Returns JSON                                           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend receives:                                       │
│    - answer (markdown string with [N] markers)              │
│    - sources[] (one entry per cited [N])                    │
│    - inline_citations[] (per-marker metadata)               │
│    - survey_chunks_data[] inside [3] source (verbatim mode) │
│    - interview_chunks_data[] inside [4] source              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend renders:                                        │
│    - Inline pills (per inline_citations entry)              │
│    - Bottom chips (per sources entry)                       │
└─────────────────────────────────────────────────────────────┘
```

**No follow-up calls.** Everything needed to render every citation is in the single response.

---

## 3. Request Payload (what frontend sends)

```json
{
  "chatInput": "What are the top barriers among UK respondents?",
  "org_id": "<org_uuid>",
  "sessionId": "<session_uuid>",
  "request_id": "<unique_uuid_per_message>",
  "weighted": true,
  "data_source_mode": "both",
  "qual_enabled": true
}
```

**No citation-specific fields.** The backend decides which sources to cite based on what the AI retrieved.

---

## 4. Response Payload (what backend returns)

Full shape — fields marked `(verbatim only)` are populated only when applicable:

```json
{
  "answer": "Among UK respondents, the top barrier is cost (47%) [3]. The Report confirms this is consistent across age bands [1].\n\nIn their own words: \"Using less, putting more back in...\" [3]",

  "sources": [
    {
      "index": 1,
      "type": "document",
      "doc_type": "Main Report",
      "filename": "DR1053-SustainabilityCultureReport.pdf",
      "document_title": "Sustainability Research Report",
      "question_code": "Q11",
      "chunk_topic": "Barriers to Sustainability",
      "doc_summary": "Verified baseline data — 1,008 respondents UK + KSA.",
      "page_numbers": [20],
      "slide_numbers": [18]
    },
    {
      "index": 2,
      "type": "document",
      "filename": "Sustainability_White_Paper.pdf",
      "document_title": "Sustainability White Paper",
      "chunk_topic": "Implicit Attitudes (IRT)",
      "page_numbers": [6, 7, 8, 9],
      "slide_numbers": []
    },
    {
      "index": 3,
      "type": "survey",
      "filename": "DR1053-SurveyData-N1008.csv",
      "document_title": "Survey Data (N=1,008)",
      "question_code": "Q11",
      "question_codes": null,
      "chunk_topic": "Barriers to Sustainability",
      "sample_description": "UK",
      "base_size": 504,
      "page_numbers": [],
      "slide_numbers": [],

      "survey_chunks_data": [
        {
          "country": "UK",
          "age_band": "55-64",
          "gender_label": "Male",
          "segment_name": "Do Their Bit for Others",
          "question_code": "Q1",
          "question_text": "In your own words, what does sustainability mean to you?",
          "verbatim": "Using less, putting more back in, not wasting anything..."
        }
      ]
    },
    {
      "index": 4,
      "type": "interview",
      "filename": "Interview Transcripts",
      "document_title": "Qualitative Interviews",
      "quote_count": 3,

      "interview_chunks_data": [
        {
          "respondent_id": "INT-046",
          "interview_country": "UK",
          "interview_gender": "Female",
          "interview_age": "25-34",
          "segment_name": "Muddled Middle Majority",
          "moderator_question": "Tell me about your relationship with sustainability",
          "chunk_preview": "Yeah, I think for me sustainability is about...",
          "similarity": 0.78
        }
      ]
    }
  ],

  "inline_citations": [
    { "index": 3, "marker_position": 56, "q_codes": ["Q11"] },
    { "index": 1, "marker_position": 142, "q_codes": null },
    { "index": 3, "marker_position": 245, "q_codes": null }
  ]
}
```

**Key rules:**

1. `sources[]` has at most one entry per index (one [1], one [2], one [3], one [4]).
2. `inline_citations[]` has one entry per `[N]` marker that appears in `answer` — there can be multiple `[3]` markers.
3. `marker_position` = absolute character offset of `[N]` in `answer` string. Use it to inject the inline pill at the correct position.
4. `survey_chunks_data` and `interview_chunks_data` arrays can have up to 1000 rows — they're the haystack for verbatim-mode matching.

---

## 5. Inline Citation Rendering — All Four Types

For each entry in `inline_citations[]`:
1. Find matching `sources[i]` where `index === marker.index`.
2. Slice `answer.substring(marker.marker_position - 600, marker.marker_position)` to get the preceding text (used for verbatim matching).
3. Render the appropriate pill based on type and mode.

### 5a. Inline `[1]` — DHS Sustainability Report

| Popover line | Source field | Notes |
|---|---|---|
| Title: "Sustainability Research Report" | `sources[i].document_title` | |
| Q-code: "Q11" | `sources[i].question_code` | May be `null` for non-Q-coded chunks |
| Question wording | **`Q_CODE_QUESTIONS[source.question_code]`** | **NOT in payload — hardcoded lookup in `survey-codes.ts`** |
| Topic: "Barriers to Sustainability" | `sources[i].chunk_topic` | |
| Page badge: "Page 20" | `sources[i].page_numbers[]` | Empty array → omit badge |
| Slide badge: "Slide 18" | `sources[i].slide_numbers[]` | Empty array → omit badge |

**Render priority:** prefer `slide_numbers` over `page_numbers` if both populated and `doc_type === "Main Report"`.

### 5b. Inline `[2]` — White Paper (IRT/Implicit Attitudes)

| Popover line | Source field | Notes |
|---|---|---|
| Title: "Sustainability White Paper" | `sources[i].document_title` | |
| Topic: "Implicit Attitudes (IRT)" | `sources[i].chunk_topic` | May fall back to default "Implicit Attitudes (IRT)" if null |
| Page badge: "Pages 6, 7, 8, 9" | `sources[i].page_numbers[]` | Multiple pages possible |

**No Q-code shown for `[2]`** — IRT data isn't tied to a specific survey question.

### 5c. Inline `[3]` — Survey Data (TWO modes)

**Mode detection:**
1. Slice `precedingText = answer.substring(marker.marker_position - 600, marker.marker_position)`.
2. Call `findVerbatimByContext(source.survey_chunks_data, precedingText)` from `citation-utils.ts`.
3. If returns a row → **verbatim mode**. If returns `null` → **figure mode**.

**Mode 1 — Figure mode (most common):**

| Popover line | Source field | Notes |
|---|---|---|
| Title: "Survey Data" | `sources[i].document_title` (frontend may strip "(N=1,008)") | |
| Q-code: "Q11" | `sources[i].question_code` | |
| Question wording | **`Q_CODE_QUESTIONS[source.question_code]`** | **Hardcoded lookup** |
| Topic: "Barriers to Sustainability" | `sources[i].chunk_topic` | |
| Sample: "UK Females 25-34, n=87" | `sources[i].sample_description` + `sources[i].base_size` | |

**Mode 2 — Verbatim mode (when AI quotes a specific respondent):**

| Popover line | Source | Notes |
|---|---|---|
| Title: "Survey verbatim · Q1" | `matchedRow.question_code` | Per row, can differ from source-level |
| Question wording | `matchedRow.question_text` | **In payload** (per row) |
| Quote text | `matchedRow.verbatim` | **In payload** |
| Demographics: "UK Male 55-64" | `matchedRow.country` + `gender_label` + `age_band` | |
| Segment: "Do Their Bit for Others" | `matchedRow.segment_name` | |

**Note:** verbatim-mode sample/base_size are NOT shown in the per-quote popover — those are aggregate fields shown only in the bottom chip.

### 5d. Inline `[4]` — Interview Quotes

`[4]` is **always verbatim mode**. Match preceding text against `interview_chunks_data` using `findChunkByContext`.

| Popover line | Source | Notes |
|---|---|---|
| Title: "Interview · INT-046" | `matchedRow.respondent_id` | Per row |
| Moderator question | `matchedRow.moderator_question` | **In payload** (per row, from transcript) |
| Quote text | `matchedRow.chunk_preview` | **In payload** (longer than survey verbatims, ~200 chars) |
| Demographics: "UK Female 25-34" | `matchedRow.interview_country` + `interview_gender` + `interview_age` | Note `interview_*` prefix |
| Segment: "Muddled Middle Majority" | `matchedRow.segment_name` | |

**Fallback when no match:** open the full quotes drawer (showing all chunks in `interview_chunks_data`). This happens when AI puts a single `[4]` at the end of a header sentence covering multiple quotes below it.

---

## 6. Bottom Citation Chip Rendering — All Four Types

For each entry in `sources[]`, render one chip in the Sources bar.

### 6a. Bottom `[1]` — DHS Sustainability Report

| Chip / panel content | Source field |
|---|---|
| Chip label: "1 Sustainability Research Report" | `sources[i].document_title` |
| Page badge on chip | First entry of `sources[i].page_numbers[]` |
| Expanded panel — full title | `sources[i].document_title` |
| Expanded panel — summary | `sources[i].doc_summary` |
| Expanded panel — page list | `sources[i].page_numbers[]` joined |
| Expanded panel — Q-code tag | `sources[i].question_code` |
| Expanded panel — topic | `sources[i].chunk_topic` |

### 6b. Bottom `[2]` — White Paper

| Chip / panel content | Source field |
|---|---|
| Chip label: "2 Sustainability White Paper" | `sources[i].document_title` |
| Page badge on chip | First entry of `sources[i].page_numbers[]` |
| Expanded panel — page list | `sources[i].page_numbers[]` joined ("Pages 6, 7, 8, 9") |
| Expanded panel — topic | `sources[i].chunk_topic` |

### 6c. Bottom `[3]` — Survey Data

| Chip / panel content | Source field |
|---|---|
| Chip label: "3 Survey Data" | `sources[i].document_title` |
| Sample badge on chip | `sources[i].sample_description` + `base_size` ("UK / n=504") |
| Expanded panel — Q-code(s) | `sources[i].question_code` (or `question_codes[]` for multi-Q synthesis answers) |
| Expanded panel — topic | `sources[i].chunk_topic` |
| Expanded panel — sample size | `sources[i].sample_description` + `base_size` |

**Multi-Q synthesis case:** when `sources[i].question_codes` is a non-null array (e.g. `["Q4","Q11","Q12"]`), the chip should show "Multiple survey topics" with the Q-code list — the AI synthesised across multiple survey questions.

### 6d. Bottom `[4]` — Interview Quotes

**Critical extra step before rendering:** filter `interview_chunks_data` to only chunks actually cited inline.

```ts
import { filterCitedInterviewSources } from "@/lib/citation-utils";

const displaySources = filterCitedInterviewSources(
  response.answer,
  response.inline_citations,
  response.sources
);
```

This narrows the bottom drawer count to match the number of inline `[4]` pills. Without this step, the drawer shows all 50 retrieved chunks instead of the 3 actually cited.

| Chip / panel content | Source field |
|---|---|
| Chip label: "4 Qualitative Interviews (3)" | `sources[i].document_title` + `quote_count` (after filtering) |
| Click chip | Opens drawer with all cited chunks (each rendered with `chunk_preview`, `moderator_question`, demographics) |

---

## 7. Where Each Field Lives — Master Table

Legend: ✅ in payload, ❌ NOT in payload (frontend lookup), 🔧 frontend code logic

| Field | [1] inline | [1] bottom | [2] inline | [2] bottom | [3] figure inline | [3] verbatim inline | [3] bottom | [4] inline | [4] bottom |
|---|---|---|---|---|---|---|---|---|---|
| Document title | ✅ source | ✅ source | ✅ source | ✅ source | ✅ source | ✅ source | ✅ source | ✅ source | ✅ source |
| Document summary | n/a | ✅ source | n/a | ✅ source | n/a | n/a | n/a | n/a | n/a |
| Q-code | ✅ source | ✅ source | n/a | n/a | ✅ source | ✅ matched row | ✅ source | n/a | n/a |
| Question wording | ❌ Q_CODE_QUESTIONS | n/a | n/a | n/a | ❌ Q_CODE_QUESTIONS | ✅ matched row | n/a | ✅ matched row | n/a |
| Topic / chunk_topic | ✅ source | ✅ source | ✅ source | ✅ source | ✅ source | n/a | ✅ source | n/a | n/a |
| Quote text | n/a | n/a | n/a | n/a | n/a | ✅ matched row | n/a | ✅ matched row | ✅ matched row |
| Demographics (country/gender/age) | n/a | n/a | n/a | n/a | n/a | ✅ matched row | ✅ source (sample_description) | ✅ matched row | n/a |
| Segment name | n/a | n/a | n/a | n/a | n/a | ✅ matched row | n/a | ✅ matched row | n/a |
| Page numbers | ✅ source | ✅ source | ✅ source | ✅ source | n/a | n/a | n/a | n/a | n/a |
| Slide numbers | ✅ source | ✅ source | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Sample description / base_size | n/a | n/a | n/a | n/a | ✅ source | n/a | ✅ source | n/a | n/a |
| Respondent ID (interview) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ✅ matched row | n/a |
| Moderator question | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ✅ matched row | ✅ matched row |
| Inline marker position | 🔧 inline_citations | n/a | 🔧 inline_citations | n/a | 🔧 inline_citations | 🔧 inline_citations | n/a | 🔧 inline_citations | n/a |
| Verbatim matching logic | n/a | n/a | n/a | n/a | n/a | 🔧 citation-utils | n/a | 🔧 citation-utils | n/a |
| Drawer narrowing (cited only) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | 🔧 citation-utils |

**Two things ever fall outside the payload:**
1. **Question wording** for figure-mode `[1]` / `[2]` / `[3]` chips → hardcoded `Q_CODE_QUESTIONS` lookup (in `survey-codes.ts`).
2. **String-matching algorithms** for verbatim-mode `[3]` / `[4]` chips → pure functions in `citation-utils.ts`.

Everything else is in the JSON response.

---

## 8. Files Required

All paths relative to the `_handover/` bundle root.

| File | Purpose | Edit-required? |
|---|---|---|
| `lib/types.ts` | TypeScript interfaces — `Source`, `InlineCitation`, `SurveyChunkData`, `InterviewChunkData` | Copy as-is |
| `lib/survey-codes.ts` | `Q_CODE_QUESTIONS` lookup + per-question option dictionaries (Q9_ACTIONS, Q11_BARRIERS, etc.) | Copy as-is |
| `lib/citation-utils.ts` | Pure helper functions — `findVerbatimByContext`, `findChunkByContext`, `filterCitedInterviewSources`, `extractLastQuote`, `stripDisfluencies`, `deepNormalize`, `parseInlineCitations`, `isValidSource` | Copy as-is — **do not rewrite** (hardened across 30+ phases) |
| `components/MarkdownResponse.tsx` | Reference — how to render markdown answer + inject inline `[N]` pills at correct character positions using `marker_position` | Adapt to your styling |
| `components/CitationChip.tsx` | Reference — contains all 4 popover variants (document, survey figure, survey verbatim, interview) PLUS exported `CitationBar` (bottom Sources bar) and inner `InterviewQuotesDialog` (drawer for [4] fallback) | Adapt to your styling |

**Required dependencies:**
- React 19 (or compatible)
- TypeScript (or compile to JS)
- A markdown renderer (the reference uses `react-markdown` — any equivalent works)

**No backend dependencies.** The citation system is pure frontend rendering on top of the JSON response.

---

## 9. Implementation Checklist

In suggested order:

- [ ] 1. Copy `lib/types.ts` → confirm types match the response shape your backend returns.
- [ ] 2. Copy `lib/survey-codes.ts` → confirm `Q_CODE_QUESTIONS` covers all Q-codes used in your survey.
- [ ] 3. Copy `lib/citation-utils.ts` → no edits needed.
- [ ] 4. Implement bottom Sources bar (easiest):
  - Loop `sources[]`, render one chip per entry by `index`/`type`.
  - For `[4]`, run `filterCitedInterviewSources` first.
- [ ] 5. Implement markdown renderer with inline pill injection:
  - Use `inline_citations[i].marker_position` to locate each `[N]` in `answer`.
  - Replace each `[N]` with a clickable `InlineCitationChip` component.
- [ ] 6. Implement popover content per chip type:
  - `[1]` / `[2]` document branch → fields from `sources[i]`.
  - `[3]` figure branch → fields from `sources[i]` + `Q_CODE_QUESTIONS` lookup.
  - `[3]` verbatim branch → call `findVerbatimByContext` → render from matched row.
  - `[4]` branch → call `findChunkByContext` → render from matched row, fallback to drawer if null.

---

## 10. Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Reading `source.question_code` for verbatim popover | Verbatim chip shows wrong Q-code | Use `matchedRow.question_code` from `survey_chunks_data` (P274 architecture: DB row IS the citation) |
| Skipping `filterCitedInterviewSources` for `[4]` | Bottom drawer shows 50 chunks instead of 3 cited | Call `filterCitedInterviewSources(answer, inline_citations, sources)` before passing sources to CitationBar |
| Counter-based dedup for inline pills | Off-by-one popover content (chip 2 shows chip 1's data) | Dedup using `marker_position` as stable identity, not a render-phase counter (see P273-BugC, P274c) |
| Asymmetric whitespace normalisation in matching | Verbatim chip falls through to fallback for quotes with double-spaces | Already handled in `findVerbatimByContext` (P289 whitespace-tolerant regex fallback) — don't reimplement |
| Treating `page_numbers: []` as missing data | Empty page badges render as "Page " | Check array length before rendering — if empty, omit badge |
| Looking up question text in payload for figure-mode | `null` question wording in popovers | Question wording is NOT in payload for figure mode — use `Q_CODE_QUESTIONS[source.question_code]` |
| Rebuilding the matching algorithm | Fragile matching, edge-case bugs | Copy `citation-utils.ts` as-is — it's been through 30+ bug-fix phases |

---

## 11. Quick Reference — Render Each Pill

```ts
// Inline pill, given `marker` (from inline_citations) and `source` (matched from sources[]):

if (source.type === "document") {
  // [1] or [2]
  return <DocumentPopover
    title={source.document_title}
    qCode={source.question_code}
    questionText={Q_CODE_QUESTIONS[source.question_code]}  // ← hardcoded lookup
    topic={source.chunk_topic}
    pages={source.page_numbers}
    slides={source.slide_numbers}
  />;
}

if (source.type === "survey") {
  // [3] — try verbatim mode first
  const precedingText = answer.substring(
    Math.max(0, marker.marker_position - 600),
    marker.marker_position
  );
  const matched = findVerbatimByContext(source.survey_chunks_data, precedingText);

  if (matched) {
    return <SurveyVerbatimPopover
      qCode={matched.question_code}
      questionText={matched.question_text}
      verbatim={matched.verbatim}
      country={matched.country}
      gender={matched.gender_label}
      age={matched.age_band}
      segment={matched.segment_name}
    />;
  }

  // Fall through to figure mode
  return <SurveyFigurePopover
    qCode={source.question_code}
    questionText={Q_CODE_QUESTIONS[source.question_code]}
    topic={source.chunk_topic}
    sample={source.sample_description}
    baseSize={source.base_size}
  />;
}

if (source.type === "interview") {
  // [4]
  const precedingText = answer.substring(
    Math.max(0, marker.marker_position - 200),
    marker.marker_position
  );
  const matched = findChunkByContext(source.interview_chunks_data, precedingText);

  if (matched) {
    return <InterviewPopover
      respondentId={matched.respondent_id}
      moderatorQuestion={matched.moderator_question}
      quote={matched.chunk_preview}
      country={matched.interview_country}
      gender={matched.interview_gender}
      age={matched.interview_age}
      segment={matched.segment_name}
    />;
  }

  // Fall through to full drawer
  return <InterviewQuotesDialog chunks={source.interview_chunks_data} />;
}
```

---

## 12. Bundle Contents

This handoff package includes:

- `CITATION-HANDOFF.md` — this document
- `lib/types.ts` — TypeScript interfaces
- `lib/survey-codes.ts` — Q-code lookups
- `lib/citation-utils.ts` — matching helpers
- `components/MarkdownResponse.tsx` — reference markdown renderer with inline pill injection
- `components/CitationChip.tsx` — reference popover variants + exported `CitationBar` (bottom bar) + `InterviewQuotesDialog` (drawer fallback)

Drop `lib/*` into your project's `lib/` folder. Use `components/*` as reference — adapt to your design system.

---

## 13. Questions / Contact

Backend questions → karhoo@disrupt-insight.com
