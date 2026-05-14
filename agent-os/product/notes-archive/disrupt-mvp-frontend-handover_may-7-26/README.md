# Disrupt MVP — Frontend Handover Bundle

> **Generated:** 2026-05-06
> **Purpose:** everything a new frontend needs to replicate the existing chat UI's persona / custom audience / focus group features against the existing n8n + Supabase backend.

## What's in this bundle

```
_handover/
├── README.md                  # this file
├── WEBHOOK-CONTRACT.md        # ⭐ START HERE — full backend payload contract
│
├── lib/                       # 5 files — REQUIRED, copy as-is
│   ├── segments.ts            # SEGMENT_PROFILES + Voice DNA + buildSegmentBriefText()
│   ├── types.ts               # All TypeScript interfaces
│   ├── audience-query.ts      # Filter parsing + buildFiltersSummary()
│   ├── credits.ts             # Credit cost constants
│   └── citation-utils.ts      # Citation chip matching helpers (HARDENED — don't reinvent)
│
├── api/                       # 15 Next.js API routes (or equivalent in your stack)
│   ├── audience/              # filter-options, preview, profile, respondents, saved
│   ├── persona/               # select, twin
│   ├── segments/              # GET live segment list
│   ├── n8n/                   # ⭐ the webhook proxy (adds x-webhook-secret server-side)
│   ├── chat/                  # poll, history, claim
│   └── credits/               # balance, consume
│
└── components/                # 7 reference UI components — optional, copy/adapt
    ├── PersonaPanel.tsx       # Right-sidebar with 3 tabs (Segments / Custom Audience / Focus Group)
    ├── AudienceBuilder.tsx    # Custom audience filter UI with sliders
    ├── FocusGroupSetup.tsx    # Participant picker
    ├── FocusGroupView.tsx     # Threaded roundtable view
    ├── ChatInterface.tsx      # ⭐ Webhook payload composition (lines 630-720 = persona logic)
    ├── CitationChip.tsx       # Citation chip popovers [1]/[2]/[3]/[4]
    └── MarkdownResponse.tsx   # Markdown + inline citation injection
```

## Reading order

1. **`WEBHOOK-CONTRACT.md`** — the 5 query modes (normal / segment / custom audience / digital twin / focus group), payload shapes, response schema, citation chip rendering rules, behaviour rules.
2. **`lib/segments.ts`** — read the comment block at top + look at `SEGMENT_PROFILES` and `VOICE_DNA_MAP`. This is the persona brain.
3. **`components/ChatInterface.tsx` lines 630–720** — the actual code that composes the webhook payload for persona vs custom audience vs digital twin. Worth reading even if you'll write your own version.
4. **`components/CitationChip.tsx`** — citation chip popover rendering. The matching logic (`findChunkByContext`, `findVerbatimByContext`) is in `lib/citation-utils.ts` and has been hardened over 30+ bug-fix phases — strongly recommend copying as-is rather than rewriting.

## Required environment variables

Frontend needs these (Vercel project settings → environment variables):

```
N8N_WEBHOOK_URL=https://disrupt-mvp.app.n8n.cloud/webhook/1753416f-47cf-4d1b-ae91-a311331d0a35
N8N_WEBHOOK_SECRET=<get from karhoo@disrupt-insight.com — never commit>

NEXT_PUBLIC_SUPABASE_URL=https://jeepbsysmivdhsqlfdws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public, fine to commit via NEXT_PUBLIC_>
SUPABASE_SERVICE_ROLE_KEY=<server-only, never commit>
```

⚠️ **NEVER inline secrets in command-line scripts or JS source.** They get logged in tool-call permission files and end up in git. Always use `process.env.X` or a credential vault. (See P290 incident — n8n JWT got leaked to GitHub for 3 months because of inlined `--token=...` patterns.)

## Backend contracts in 30 seconds

```
USER ACTION                   → FRONTEND DOES                       → BACKEND RECEIVES
──────────────────────────────────────────────────────────────────────────────────────
Send chat message (normal)    → POST /api/n8n with base fields      → ChatInput + base fields
Click segment chip            → POST /api/n8n with persona_mode +    → Picks SEGMENT_PROFILES[id],
                                segment_id                              composes brief, runs persona route
Build custom audience +       → 1) POST /api/audience/profile         → server returns brief_text composed
  click "Explore"               2) POST /api/n8n with persona_mode    → AI runs persona route on dynamic brief
                                  + persona_brief + persona_brief_concern
Pick interviewee for twin     → POST /api/persona/twin (returns        → AI runs with full transcript memory
                                profile) → POST /api/n8n with
                                digital_twin: true + digital_memory
Configure focus group         → POST /api/n8n with focus_group: true   → backend fans out to participant
                                + participants array                     personas, returns array of responses
```

## Backend smoke test

Confirm the backend is healthy before wiring your frontend:

```bash
curl -X POST https://disrupt-mvp.app.n8n.cloud/webhook/1753416f-47cf-4d1b-ae91-a311331d0a35 \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $N8N_WEBHOOK_SECRET" \
  -d '{
    "chatInput": "hi",
    "org_id": "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "session_id": "smoke-test",
    "weighted": true,
    "data_source_mode": "both",
    "qual_enabled": true,
    "request_id": "00000000-0000-0000-0000-000000000001"
  }'
```

Expected: 200 OK, ~20s, greeting JSON.

## Estimated frontend work

| Feature | Effort | Notes |
|---------|--------|-------|
| Normal chat with citation chips | 1–2 days | Most complex — `MarkdownResponse` + `CitationChip` + 4 chip types |
| Segment persona | 0.5 day | UI + payload swap (segment_id) |
| Custom audience builder | 1 day | Filter UI + `/api/audience/preview` debounced + `/api/audience/profile` on Explore |
| Digital twin | 0.5 day | Interviewee picker + payload swap (digital_memory) |
| Focus group | 1–2 days | Participant picker + threaded roundtable rendering |
| Threading (prior_messages) | 0.5 day | Last 6-message slice on each send |
| Credit handling | 0.5 day | Pre-flight `/consume` + post-response `credit_surcharge` deduction |
| Long-poll for cache misses | 0.5 day | Poll `/api/chat/poll` every 2s until done |
| **Total** | **~5–7 days** | If reusing the bundled components, ~3 days |

## Questions / contact

Backend questions → karhoo@disrupt-insight.com (Disrupt Insight)
Webhook secret + Vercel env access → same

## What's NOT in this bundle (out of scope)

- Authentication / login flows (`src/app/login/`, `src/middleware.ts` — depends on your stack)
- Admin panel (`src/app/admin/`) — admin-only credit + org settings
- Studio panel (`src/components/StudioPanel.tsx` — podcast / mind map / quiz generators)
- Sidebar / source list rendering (`src/components/Sidebar.tsx`) — straightforward to rebuild
- D3 chart components (`src/components/charts/`) — segment matrix + conviction gauge
- Layout shell (`src/components/AppShell.tsx`) — depends on your design system
- All Tailwind / Shadcn UI primitives — assume you have your own equivalents

If the dev needs any of these, ask and we'll pull them.
