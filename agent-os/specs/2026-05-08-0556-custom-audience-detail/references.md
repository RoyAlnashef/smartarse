# References for Custom Audience Detail

## Similar Implementations

### Persona Drawer and Existing Audience Tab
- **Location:** [components/client/project-detail/persona-drawer.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx)
- **Relevance:** Primary source for persona detail behavior parity and current custom audience controls.
- **Key patterns:** tab state management, persona apply/clear semantics, detail/list transitions, mobile + desktop sidebar behavior.

### Client Chat Page (Apply Context -> Payload -> Persist)
- **Location:** [app/client/projects/[id]/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/client/projects/[id]/page.tsx)
- **Relevance:** Existing persona application flow that resets chat context and injects persona metadata into outbound requests.
- **Key patterns:** applied-context state, message/session reset semantics, history restore behavior.

### Webhook Submit Hook and Persist Route
- **Location:** [hooks/useChatQuestion.ts](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts), [app/api/chat/persist/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/chat/persist/route.ts)
- **Relevance:** Canonical app contract for outbound chat payloads and persisted metadata.
- **Key patterns:** mode-aware webhook body assembly, pending/complete persistence, merge/thread metadata handling.

### Client Chat History Card
- **Location:** [components/client/project-detail/chat-history-card.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/chat-history-card.tsx)
- **Relevance:** Client-side history row rendering for segment color indicators.
- **Key patterns:** dot/color token rendering, selected-row styling, loading behavior.

### Dashboard Chat Sidebar
- **Location:** [components/chat/chat-sidebar.tsx](/Users/royalnashef/Desktop/smart-arse/components/chat/chat-sidebar.tsx), [app/(dashboard)/projects/[id]/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/(dashboard)/projects/[id]/page.tsx)
- **Relevance:** Admin/dashboard history panel requiring the same stacked-dot custom-audience treatment.
- **Key patterns:** metadata map for each conversation row, shared segment color-token helper usage.

## Handover Bundle References (Parity Support)

### Handover Entry and Behavioral Expectations
- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/README.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/README.md)
- **Relevance:** Defines intended persona/custom-audience/focus-group frontend behavior and integration reading order.
- **Key patterns:** audience flow sequence, API responsibilities, contract checkpoints.

### Webhook Contract
- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/WEBHOOK-CONTRACT.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/WEBHOOK-CONTRACT.md)
- **Relevance:** Query-mode fields and response-shape expectations.
- **Key patterns:** custom-audience mode payload requirements, poll/claim flow compatibility.

### Handover Payload Composition
- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/ChatInterface.tsx](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/ChatInterface.tsx)
- **Relevance:** Practical reference for mode-specific payload assembly.
- **Key patterns:** persona/custom-audience mode branching and context propagation.

### Handover Audience Builder and Query Helpers
- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/AudienceBuilder.tsx](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/AudienceBuilder.tsx), [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/audience-query.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/audience-query.ts)
- **Relevance:** Filter semantics and summary logic for custom audience composition.
- **Key patterns:** input normalization, API payload shape, user-facing summary construction.

### Handover Audience Saved Routes
- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/audience/saved/route.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/audience/saved/route.ts), [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/audience/saved/[id]/route.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/audience/saved/[id]/route.ts)
- **Relevance:** Save/list/update lifecycle expectations for persisted audiences.
- **Key patterns:** CRUD envelope shapes and identifier handling for saved audience records.

### Handover Credits Reference
- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/credits.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/credits.ts)
- **Relevance:** Query-type credit cost assumptions, including custom-audience mode.
- **Key patterns:** mode-based cost constants and checks to validate parity or document intentional differences.

## Handover Parity Audit (Closeout)

### Matched
- **Webhook payload mode fields:** Current payload assembly includes `chat_context_mode`, `custom_audience` metadata, and preserves persona/default mode branching in [hooks/useChatQuestion.ts](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts).
- **Persist contract coverage:** Chat persistence captures custom audience id/name/child segment arrays and context mode in [app/api/chat/persist/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/chat/persist/route.ts).
- **Saved audience lifecycle:** Save/list/update endpoints and project/org scoping are implemented in [app/api/audience/saved/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/audience/saved/route.ts) and [app/api/audience/saved/[id]/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/audience/saved/[id]/route.ts).
- **Poll fallback path:** Long-running request fallback remains present (`/api/chat/poll`) and is used when direct webhook completion is not available in [hooks/useChatQuestion.ts](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts).

### Intentional Differences
- **Custom audience payload shape vs handover:** Handover contract documents `persona_mode + persona_brief` for custom audiences. Current app uses explicit structured `custom_audience` metadata and `chat_context_mode` while keeping persona mode intact for persona segment chats. This is an intentional, typed app-side contract extension for reliable persistence/restore across history surfaces.
- **Credit constants source of truth:** Handover `lib/credits.ts` suggests differentiated costs (custom audience > persona > standard). Current app credit charging is enforced by backend billing flow and persisted `credits_charged`; frontend does not hardcode these cost constants in this feature path. Treated as backend-owned behavior, not a frontend regression.
