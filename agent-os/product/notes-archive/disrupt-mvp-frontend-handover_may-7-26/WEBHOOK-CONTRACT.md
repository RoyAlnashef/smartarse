# Disrupt MVP — Webhook Contract for Frontend

> Last updated: 2026-05-06
> Backend: n8n self-hosted at `https://disrupt-mvp.app.n8n.cloud`
> Webhook path: `/webhook/1753416f-47cf-4d1b-ae91-a311331d0a35`
> Auth: header `x-webhook-secret: $N8N_WEBHOOK_SECRET` (server-side only — frontend uses the `/api/n8n` proxy)

---

## Architecture (1-page summary)

```
Frontend (Vercel) ──POST /api/n8n──> Vercel proxy adds auth header
                                       │
                                       ▼
                                n8n webhook (self-hosted)
                                       │
                                       ▼
                Classifier → Guardrail → AI Agent → FCR → Response
```

The frontend NEVER calls n8n directly — always goes through `/api/n8n` (Next.js API route) which adds the `x-webhook-secret` header server-side. This keeps the secret out of the browser.

For your own frontend stack, replicate the proxy pattern: server-side endpoint that holds the webhook secret in env and forwards the body to n8n.

---

## 5 query modes — payload contracts

All modes share these **base fields** (always required):

```typescript
interface BaseChatPayload {
  chatInput: string;              // The user's question
  org_id: string;                 // UUID — see "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c" for Disrupt Insight
  session_id: string;             // Frontend-generated — used for STM threading
  weighted: boolean;              // typically true (use weighted survey calculations)
  data_source_mode: "both" | "reports_only" | "survey_only";  // typically "both"
  qual_enabled: boolean;          // typically true (enables qualitative interview retrieval)
  request_id: string;             // UUID — must be a real UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  prior_messages?: Array<{        // for threaded follow-ups (P142)
    role: "user" | "assistant";
    content: string;
  }>;
}
```

### Mode 1 — Normal chat (default)

Just send the base fields. No extra flags.

```json
{
  "chatInput": "What are the top barriers to sustainability among UK respondents?",
  "org_id": "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "session_id": "user-session-abc123",
  "weighted": true,
  "data_source_mode": "both",
  "qual_enabled": true,
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response shape:** see "Response schema" below. Includes `sources`, `inline_citations`, citation chips render `[1]/[2]/[3]/[4]`.

---

### Mode 2 — Segment Persona

User clicks one of the 4 segment chips.

```json
{
  "chatInput": "Why don't you buy more sustainable products?",
  "...all base fields...": "...",
  "persona_mode": true,
  "segment_id": 3
}
```

| `segment_id` | Segment Name |
|:---:|---|
| `1` | The Do Nothing-ers |
| `2` | The Minimalists |
| `3` | The Muddled Middle Majority |
| `4` | Do Their Bit for Others |

n8n looks up the segment server-side, composes the Voice DNA brief, fetches 5 real interview quotes from that segment, and runs the AI Agent in persona mode.

**Response shape:** `_isPersona: true`, NO `sources` array (persona mode bypasses retrieval). Frontend should hide CitationBar when `_isPersona === true`.

---

### Mode 3 — Custom Audience

User builds a filtered audience (e.g. "UK Females 25-34 with high concern"). The frontend pre-composes the persona brief client-side using `buildSegmentBriefText()` from `lib/segments.ts`.

**Step 1:** When user clicks "Explore This Audience", call `/api/audience/profile` with the filters → server returns a `CustomAudienceProfile` with `brief_text` already composed.

**Step 2:** When user fires a chat query in this mode, send:

```json
{
  "chatInput": "What would convince you to buy sustainable products?",
  "...all base fields...": "...",
  "persona_mode": true,
  "persona_brief": "<the brief_text from CustomAudienceProfile>",
  "persona_brief_concern": 6.8
}
```

**Note:** NO `segment_id` for custom audiences. The brief text replaces it.

**Response shape:** same as segment persona — `_isPersona: true`, no citations.

---

### Mode 4 — Digital Twin (specific interviewee)

User picks a specific interview respondent (e.g. INT-046).

```json
{
  "chatInput": "Tell me about your sustainability journey.",
  "...all base fields...": "...",
  "persona_mode": true,
  "persona_brief": "<composed from interviewee profile>",
  "persona_brief_concern": 7,
  "digital_twin": true,
  "digital_memory": {
    "interview_id": "INT-046",
    "transcript_summary": "...",
    "key_quotes": ["..."],
    "demographics": { "country": "UK", "age": 38, "gender": "Male", "segment": "Do Their Bit for Others" }
  }
}
```

**Use case:** asking a specific real interviewee follow-up questions. AI uses their actual transcript as ground truth.

---

### Mode 5 — Focus Group

User picks 3-6 participants and runs a roundtable.

```json
{
  "chatInput": "How do you feel about EVs?",
  "...all base fields...": "...",
  "focus_group": true,
  "participants": [
    { "type": "segment", "segment_id": 1 },
    { "type": "segment", "segment_id": 4 },
    { "type": "interviewee", "interview_id": "INT-046" }
  ]
}
```

**Response shape:** array of responses keyed by participant. See `FocusGroupView.tsx` for rendering.

---

## Response schema

All 5 modes return:

```typescript
interface ChatResponse {
  answer: string;                       // Markdown — render with react-markdown
  sources: Source[];                    // populated for normal chat; empty/missing for persona modes
  inline_citations: InlineCitation[];   // per-marker metadata for [1]/[2]/[3]/[4] chips
  weighted: boolean;
  tool_calls_used: number;              // billing proxy — 0/1/2
  credit_surcharge: number;
  numeric_verification?: {              // validates AI-cited %s against ground truth
    checked: boolean;
    q_code: string | null;
    status: "PASS" | "MISMATCH" | "NO_FIGURES";
    matches?: number;
    mismatches?: number;
    figures?: Array<{cited, expected, country, delta, status}>;
  };
  svl_routed_qcodes: string[];          // OE Q-codes routed for verbatim retrieval
  verification?: {                      // [4] interview quote fabrication strip
    total_4_citations: number;
    verified_4: number;
    stripped_4: number;
    violations: any[];
    truth_quotes_available: number;
    svl_pool_size: number;
    stripped_3: number;
  };

  // Persona-mode flags (only set in persona modes)
  _isPersona?: boolean;
  _isDigitalTwin?: boolean;
  _isFocusGroup?: boolean;
  _isCapabilityRefusal?: boolean;       // P285 Phase B refusal class
  refusal_class?: "Q_BY_Q_CROSSTAB" | "Q13Q14_SEGMENT_GAP" | "INDUSTRY_MULTISELECT_GAP";
}

interface Source {
  index: 1 | 2 | 3 | 4;
  type: "document" | "survey" | "interview";
  filename: string;
  document_title: string;
  question_code: string | null;     // e.g. "Q11"
  question_codes?: string[] | null; // multi-Q label when answer cites multiple
  chunk_topic: string | null;       // e.g. "Barriers to Sustainability"
  page_numbers: number[];
  slide_numbers: number[];
  sample_description?: string;      // e.g. "UK Females 25-34" — for [3]
  base_size?: number;               // weighted n
  doc_summary?: string;
  // Type-specific:
  interview_chunks_data?: InterviewChunkData[];  // [4] — array of quote chunks
  survey_chunks_data?: SurveyChunkData[];        // [3] — array of verbatims with demographics
}

interface InlineCitation {
  index: 1 | 2 | 3 | 4;
  marker_position: number;          // absolute char offset in answer text
  q_codes?: string[] | null;        // per-marker Q-codes
}
```

---

## Citation chip rendering rules

The frontend renders `[1]/[2]/[3]/[4]` markers in the answer text as clickable pills. Each chip type has different popover content:

| Chip | Source type | Popover shows |
|:---:|---|---|
| `[1]` | `document` (Sustainability Research Report) | document title + chunk topic |
| `[2]` | `document` (White Paper IRT) | document title + chunk topic |
| `[3]` | `survey` (SQL/tabular) | question text + verbatim quote (when matched) + demographics from DB |
| `[4]` | `interview` (qualitative) | moderator question + quote + interviewee demographics |

The actual chip rendering is in `components/CitationChip.tsx`. It uses:
- `findChunkByContext()` to match `[4]` markers to chunks via preceding-text quote anchoring
- `findVerbatimByContext()` to match `[3]` markers to survey verbatims (with whitespace-tolerant fallback)
- `filterCitedInterviewSources()` to narrow the bottom drawer to only the chunks actually cited

**Key invariant:** drawer count `(N)` must equal inline pill count. See `lib/citation-utils.ts` for the matching logic — has been hardened over 30+ phases.

---

## Important behaviour rules

1. **Persona mode hides CitationBar.** When `_isPersona === true`, do NOT render the bottom citation bar. Persona responses are opinions, not data — citations are inappropriate.

2. **Cancel/stop is client-side only.** Backend doesn't currently support server-side cancellation. The cancel button should: abort fetch, clear poll interval, set a `cancelled` flag, NOT save to history, NOT charge credits. Future server-side cancellation will be a no-op POST to `/api/chat/cancel` — frontend should stub that endpoint now for forward-compat.

3. **Long-running queries use polling.** Cache-miss queries can take 60–120s. Pattern: POST to `/api/n8n` returns immediately with a `request_id`; frontend polls `/api/chat/poll?request_id=X` every 2s until status=complete.

4. **Threading sends `prior_messages`.** Last 6 messages (3 user + 3 assistant) in chronological order. P142 in CLAUDE.md.

5. **Credit deduction happens BEFORE the chat send:**
   - Normal chat: 1 credit
   - Segment persona: 2 credits
   - Custom audience: 3 credits
   - Digital twin: 5 credits
   - Focus group: 2 credits per participant

6. **Compound queries get a surcharge.** Backend returns `credit_surcharge` 0/1/2 based on `tool_calls_used`. Frontend should deduct surcharge on top of base cost when response arrives.

---

## Smoke test (verify backend + your frontend wiring)

Fire this curl from your dev machine to confirm the backend works end-to-end:

```bash
curl -X POST https://disrupt-mvp.app.n8n.cloud/webhook/1753416f-47cf-4d1b-ae91-a311331d0a35 \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $N8N_WEBHOOK_SECRET" \
  -d '{
    "chatInput": "hi",
    "org_id": "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "session_id": "smoke-test-001",
    "weighted": true,
    "data_source_mode": "both",
    "qual_enabled": true,
    "request_id": "00000000-0000-0000-0000-000000000001"
  }'
```

Expected: 200 OK, ~20s, JSON response with a greeting message and the standard schema fields.

---

## Files in this bundle

- `lib/segments.ts` — SEGMENT_PROFILES + Voice DNA + `buildSegmentBriefText()` (the persona brief composer)
- `lib/types.ts` — all TypeScript interfaces referenced above
- `lib/audience-query.ts` — filter parsing, baselines, `buildFiltersSummary()`
- `lib/credits.ts` — credit cost constants
- `lib/citation-utils.ts` — citation chip matching helpers (frontend-critical, hardened over 30+ phases)
- `api/audience/*` — filter-options, preview, profile, respondents, saved
- `api/persona/{select,twin}` — segment + interviewee selection
- `api/segments/route.ts` — live segment data
- `api/n8n/route.ts` — the webhook proxy (adds auth header)
- `api/chat/{poll,history,claim}` — async polling + history
- `api/credits/{balance,consume}` — credit management
- `components/PersonaPanel.tsx` — right-sidebar UI with 3 tabs
- `components/AudienceBuilder.tsx` — custom audience filter builder
- `components/FocusGroupSetup.tsx` — focus group participant picker
- `components/FocusGroupView.tsx` — threaded roundtable view
- `components/ChatInterface.tsx` — webhook payload composition (lines 630-720 for persona logic)
- `components/CitationChip.tsx` — citation chip rendering with popovers
- `components/MarkdownResponse.tsx` — markdown rendering + inline citation injection
