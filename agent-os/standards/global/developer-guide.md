**1\. What You Are Connecting To**

Your Frontend (any stack)

        |

        ├── Supabase (Auth \+ Database)

        │     Project: jeepbsysmivdhsqlfdws (eu-north-1)

        │     Used for: login, session, org settings, credits, history, audience data

        │

        ├── n8n Webhook (chat agent)

        │     Called directly from browser

        │     Used for: all AI chat queries (main \+ persona mode)

        │

        └── Vercel API routes (optional — existing Next.js backend)

              Base URL: https://\<vercel-deployment-url\>

              Used for: credits, history, audience, persona, interviews, podcast

---

**2\. Credentials**

| Variable                  | Where Used                         | Exposure                             |
| :------------------------ | :--------------------------------- | :----------------------------------- |
| SUPABASE_URL              | All Supabase calls                 | Safe — public                        |
| SUPABASE_ANON_KEY         | Browser-side auth \+ queries       | Safe — public                        |
| SUPABASE_SERVICE_ROLE_KEY | Server-side admin queries only     | **SECRET — never in browser bundle** |
| N8N_WEBHOOK_URL           | Chat queries (called from browser) | Safe — public                        |
| VERCEL_API_BASE_URL       | If using existing API routes       | Safe — public                        |

---

**3\. Auth Flow**

Uses Supabase email/password auth. No custom auth layer.

javascript

import { createClient } from '@supabase/supabase-js'

const supabase \= createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Login

const { data, error } \= await supabase.auth.signInWithPassword({

email: 'user@example.com',

password: 'password'

})

// Get current user

const { data: { user } } \= await supabase.auth.getUser()

// Get org_id (needed for all chat requests)

const { data: profile } \= await supabase

.from('users')

.select('organization_id')

.eq('id', user.id)

.single()

const orgId \= profile.organization_id

\`\`\`

\*\*Important:\*\* Every user belongs to an \`organization_id\`. This must be included in all chat webhook payloads. All database queries are automatically scoped to the user's org via Supabase RLS — no manual filtering needed.

\---

\#\# 4\. Org Settings (Fetch at App Startup)

These control AI behaviour and UI state. Fetch once on login and cache in state.

\*\*Option A — via existing API route (if using Vercel deployment):\*\*

\`\`\`

GET \<VERCEL_API_BASE_URL\>/api/org/settings

Authorization: Bearer \<supabase session token\>

**Option B — direct Supabase query:**

javascript

const { data: org } \= await supabase

.from('organizations')

.select('use_weighted, data_source_mode, qual_enabled, show_source_filter')

.eq('id', orgId)

.single()

**Response shape:**

json

{

"use_weighted": true,

"data_source_mode": "both",

"qual_enabled": true,

"show_source_filter": false

}

| Setting            | Type    | Meaning                                                  |
| :----------------- | :------ | :------------------------------------------------------- | -------------- | ------------------------------------ |
| use_weighted       | boolean | Whether stats use post-stratification weights            |
| data_source_mode   | "both"  | "survey_only"                                            | "reports_only" | Which data sources the AI can access |
| qual_enabled       | boolean | Whether interview quotes \[4\] are included in responses |
| show_source_filter | boolean | Whether to show data source toggle in UI                 |

---

**5\. Core Chat Flow**

This is the main integration. All AI queries go through the n8n webhook.

**Step 1 — Generate IDs**

javascript

const requestId \= crypto.randomUUID() // unique per query

const sessionId \= crypto.randomUUID() // generate ONCE per conversation, reuse across messages

**Step 2 — POST to Webhook**

javascript

const response \= await fetch(N8N_WEBHOOK_URL, {

method: 'POST',

headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({

    chatInput: userMessage,          // string — the user's question

    org\_id: orgId,                   // UUID — from users.organization\_id

    request\_id: requestId,           // UUID — unique per query

    sessionId: sessionId,            // UUID — stable per conversation

    weighted: orgSettings.use\_weighted,

    data\_source\_mode: orgSettings.data\_source\_mode,

    qual\_enabled: orgSettings.qual\_enabled ?? false

})

})

**Timeout:** Set your fetch timeout to 85 seconds. If it times out, fall back to polling (Step 3).

**Step 3 — Handle Response or Poll**

**Fast response (\< 85s):** The webhook returns the answer directly.

javascript

if (response.ok) {

const data \= await response.json()

// data.output \= markdown answer string

// data.sources \= citation array

// data.visualizations \= optional chart specs

}

**Timeout fallback — poll for result:**

javascript

async function pollForResult(requestId) {

for (let i \= 0; i \< 60; i++) {

    const wait \= i \< 10 ? 3000 : i \< 30 ? 5000 : 8000

    await new Promise(r \=\> setTimeout(r, wait))

    const res \= await fetch(\`${VERCEL\_API\_BASE\_URL}/api/chat/poll?request\_id=${requestId}\`)

    if (res.status \=== 200\) {

      const data \= await res.json()

      if (data.status \=== 'complete' || data.status \=== 'error') {

        return data.result   // same shape as webhook response

      }

    }

    // 202 \= still processing, keep polling

}

throw new Error('Timed out waiting for result')

}

**Step 4 — Claim the result (for chat history)**

After receiving a result, fire this to associate it with the logged-in user:

javascript

fetch(\`${VERCEL_API_BASE_URL}/api/chat/claim\`, {

method: 'POST',

headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({ request_id: requestId })

})

// Fire-and-forget — don't await

---

**6\. Webhook Response Shape**

typescript

{

output: string, // Markdown-formatted AI answer

sources: Source\[\], // Citation array (see types below)

visualizations?: Visualization\[\], // D3/Vega chart specs (optional)

route?: string, // Guardrail route e.g. "REPORT_FIRST_SQL_FALLBACK"

weighted?: boolean, // Whether weighted data was used

data_source_mode?: string,

persona_mode?: boolean, // true if this was a persona query

lowBaseWarning?: boolean // true if sub-sample \< 50 respondents

}

**Source object:**

typescript

{

index: number, // Citation number \[1\], \[2\], \[3\], \[4\]

type: "document" | "survey" | "interview",

filename: string,

document_title?: string,

page: number | null,

chunk_preview: string | null,

score: number | null,

sample_size?: number | null

}

**Citation types:**

- \[1\] \= Report / white paper (document)

- \[3\] \= Survey verbatim (open-ended response)

- \[4\] \= Qualitative interview quote

- \[5\] \= Synthetic data _(future, not yet live)_

---

**7\. Persona Mode (Segment Simulation)**

To ask the AI to respond AS a segment persona, add these fields to the webhook payload:

javascript

{

...standardPayload,

persona_mode: true,

segment_id: 3, // 1-4

segment_name: "The Muddled Middle Majority",

brief_text: "...", // from /api/persona/select

digital_twin_mode: false,

twin_uuid: null,

simulation_mode: false

}

\`\`\`

\*\*Get segment brief first:\*\*

\`\`\`

POST \<VERCEL_API_BASE_URL\>/api/persona/select

Body: { "segment_id": 3 }

Returns: { "segment_id", "segment_name", "brief_text", ... }

**Segment IDs:**

| ID  | Name                        |
| :-- | :-------------------------- |
| 1   | The Do Nothing-ers          |
| 2   | The Minimalists             |
| 3   | The Muddled Middle Majority |
| 4   | Do Their Bit for Others     |

---

**8\. Available API Routes (Vercel Deployment)**

All routes require a valid Supabase session cookie or Authorization header.

| Route                                 | Method | Purpose                                                   |
| :------------------------------------ | :----- | :-------------------------------------------------------- |
| /api/org/settings                     | GET    | Org config (use_weighted, data_source_mode, qual_enabled) |
| /api/chat/history                     | GET    | Past questions for this user                              |
| /api/chat/poll?request_id=\<uuid\>    | GET    | Poll for pending chat result                              |
| /api/chat/claim                       | POST   | Associate chat result with user                           |
| /api/credits/balance                  | GET    | Current credit balance                                    |
| /api/credits/consume                  | POST   | Deduct credits for a query                                |
| /api/segments                         | GET    | All 4 segment profiles (size, metrics, voices)            |
| /api/persona/select                   | POST   | Get segment persona brief by segment_id                   |
| /api/persona/twin                     | POST   | Get digital twin brief for a real respondent              |
| /api/audience/filter-options          | GET    | Dropdown values (ethnicities, religions, etc.)            |
| /api/audience/preview                 | POST   | Count respondents matching filters                        |
| /api/audience/profile                 | POST   | Full profile for custom audience                          |
| /api/audience/respondents             | GET    | Paginated respondent browser                              |
| /api/interviews/list                  | GET    | Paginated interviewee cards                               |
| /api/interviews/match                 | POST   | Interview excerpts matching demographic filters           |
| /api/interviews/\[id\]                | GET    | Full interviewee profile \+ transcript                    |
| /api/podcast/generate                 | POST   | Trigger podcast generation                                |
| /api/podcast/poll?request_id=\<uuid\> | GET    | Poll podcast status                                       |

---

**9\. Credits System**

Credits are consumed per query type. Check balance before sending, consume after success.

| Query type         | Credit cost |
| :----------------- | :---------- |
| Standard chat      | 1           |
| Persona simulation | 2           |
| Custom audience    | 3           |
| Digital twin       | 5           |
| Focus group        | 2           |

javascript

// Check balance

const { data } \= await fetch('/api/credits/balance').then(r \=\> r.json())

if (data.balance \< requiredCredits) { /\* show low credits UI \*/ }

// Consume after successful response

await fetch('/api/credits/consume', {

method: 'POST',

body: JSON.stringify({ amount: 1, query_type: 'standard' })

})

---

**10\. Security Rules**

| Rule                          | Detail                                                                          |
| :---------------------------- | :------------------------------------------------------------------------------ |
| Never expose service role key | SUPABASE_SERVICE_ROLE_KEY only in server-side code. Never in browser bundle.    |
| Use anon key for browser      | SUPABASE_ANON_KEY is safe — RLS ensures org isolation                           |
| Webhook URL is public         | It accepts any payload but only returns meaningful data for valid org_id values |
| Don't bypass RLS              | All Supabase queries via anon key are automatically org-scoped                  |
| Admin routes are role-gated   | /api/admin/\* routes check for admin role — don't expose in standard user UI    |

---

**11\. Stack Reference (Existing Frontend — for reference)**

| Layer       | Tech                                                |
| :---------- | :-------------------------------------------------- |
| Framework   | Next.js 16 (App Router), React 19, TypeScript       |
| Styling     | Tailwind CSS 4, Shadcn UI                           |
| Charts      | D3.js 7 (ConvictionGauge, SegmentMatrix), Vega-Lite |
| Animations  | Framer Motion                                       |
| Auth client | @supabase/ssr                                       |
| Icons       | Lucide React                                        |
