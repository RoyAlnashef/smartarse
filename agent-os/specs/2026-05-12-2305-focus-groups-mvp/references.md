# References for Focus Groups MVP

Pointers to the in-app code we mirror and the handover bundle that defines the behavioral contract.

## In-app reference implementations

### Persona drawer — Focus Group tab scaffold (already 80% built)

- **Location:** [components/client/project-detail/persona-drawer.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx) lines 1865–1987.
- **Relevance:** the picker, country pills, topic textarea, and Start button are already rendered. Wiring this Start button + adding the active-state chip + credit cost preview is most of the front-end work.
- **Key patterns:** `focusParticipantIds` state with 2–4 gate, `setFocusCountryContext`, `setFocusTopic` (300 char cap), `canStartFocusGroup` boolean.

### Persona drawer — Applied chip pattern to mirror for active Focus Group card

- **Location:** [components/client/project-detail/persona-drawer.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx) lines 1215–1252.
- **Relevance:** the in-app `appliedPersona` chip and `AppliedCustomAudienceChip` are the visual templates for the active Focus Group card seen in the screenshot.
- **Key patterns:** colored dot + label + `X` clear button, brand-tinted border/background, sits above the Tabs.

### Persona drawer — tab gating

- **Location:** [components/client/project-detail/persona-drawer.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx) lines 1259–1297 and the `personaLocked`/`customAudienceLocked` flags.
- **Relevance:** mutual-exclusion gating between Segments / Custom Audience / Focus Group tabs. Add a third `focusGroupLocked` flag and apply identical gating to the other two TabsTriggers.

### Page-level applied state + handlers

- **Location:** [app/client/projects/[id]/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/client/projects/[id]/page.tsx) lines 606–760, 1320–1395.
- **Relevance:** canonical pattern for `appliedX` state + `handleApplyX` / `handleClearX` + payload composition. Mirror it with `focusGroupSession` state, `handleStartFocusGroup`, `handleFocusGroupFollowUp`, `handleEndFocusGroup`.
- **Key patterns:** lock flags composed and forwarded into both desktop and mobile drawers; webhook payload assembled in a single place via `buildWebhookBriefForSegmentPersona` / `buildWebhookBriefForCustomAudience`.

### Chat hook — webhook composer + poll/cancel patterns

- **Location:** [hooks/useChatQuestion.ts](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts).
- **Relevance:** template for the new `hooks/useFocusGroupRound.ts`. Reuse the `ChatQuestionWebhookPayload` shape (lines 35–64), the `pollForResult` helper (lines 89–127), and the `postPersist` helper (lines 129–158).
- **Key patterns:** `persona_mode: true` + `persona_brief` carry the focus-group brief; `request_id` is per-participant; `thread_anchor_request_id` groups participants under one round anchor.

### Persona webhook brief composer

- **Location:** [lib/persona-webhook-brief.ts](/Users/royalnashef/Desktop/smart-arse/lib/persona-webhook-brief.ts).
- **Relevance:** extend with `buildFocusGroupParticipantBrief(persona, { priorRounds, thisRoundResponsesSoFar, country })`. The single-segment archetype + concern prose generator stay; we wrap them with the focus-group round context.

### Chat persist + persona/audience metadata

- **Location:** [app/api/chat/persist/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/chat/persist/route.ts).
- **Relevance:** existing persist contract that already accepts `persona_segment_*` and `custom_audience_*` metadata. Extend to also accept `focus_group_session_id`, `focus_group_round_number`, `focus_group_participant_index`, and `chat_context_mode = "focus_group"`.

### Chat history card

- **Location:** [components/client/project-detail/chat-history-card.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/chat-history-card.tsx).
- **Relevance:** add a focus-group badge/icon when `chat_context_mode === "focus_group"` and group history rows by `focus_group_session_id` so one history entry per session shows initial topic + participant count + round count.
- **Key patterns:** the `historyRowHasSegmentOrAudience` helper at line 46 is where focus-group classification should slot in.

### Saved custom audience persistence (pattern for `focus_group_sessions`)

- **Location:** [supabase/migrations/202605072335_custom_audience_persistence_and_chat_metadata.sql](/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202605072335_custom_audience_persistence_and_chat_metadata.sql).
- **Relevance:** model the `focus_group_sessions` table after `project_custom_audiences` — same RLS via `auth_user_can_read_project`, same `updated_at` trigger pattern, same org/project scoping.

### Credit charging — existing trigger + thread-merge RPC

- **Location:** [supabase/migrations/202604132000_chat_results_project_credit_charge.sql](/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202604132000_chat_results_project_credit_charge.sql), [supabase/migrations/202604151200_merge_thread_credit_charge.sql](/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202604151200_merge_thread_credit_charge.sql).
- **Relevance:** the trigger must be updated to skip focus group rows (no double-charge). The new `apply_project_credit_for_focus_group_round` RPC follows the same idempotency-table pattern as `apply_project_credit_for_thread_merge` (keyed by `round_request_id` instead of `job_request_id`).
- **Key patterns:** `security definer`, `set search_path = public`, idempotent insert into a charges table, `update projects set used_credits += N, credit_balance = greatest(0, credit_balance - N)`.

### Chat context mode constraint

- **Location:** [supabase/migrations/202605072345_chat_results_context_mode.sql](/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202605072345_chat_results_context_mode.sql).
- **Relevance:** the constraint currently allows `('default', 'persona_segment', 'custom_audience')`. Extend it to also allow `'focus_group'`.

### Chat results persona/custom-audience tagging columns

- **Location:** [supabase/migrations/202605051000_chat_results_persona_segment_metadata.sql](/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202605051000_chat_results_persona_segment_metadata.sql).
- **Relevance:** template for adding nullable focus group tagging columns to `chat_results` (same `alter table ... add column if not exists` pattern + comments).

### Segment personas data + display

- **Location:** [lib/personas/segment-mocks.ts](/Users/royalnashef/Desktop/smart-arse/lib/personas/segment-mocks.ts), [lib/personas/canonical-segments.ts](/Users/royalnashef/Desktop/smart-arse/lib/personas/canonical-segments.ts), [lib/personas/segment-display.ts](/Users/royalnashef/Desktop/smart-arse/lib/personas/segment-display.ts).
- **Relevance:** source of the 4 canonical segments + their colors + qualitative interview counts. `PersonaMock` is the type the focus group picker already uses.

## Handover bundle (behavioral contract)

### Bundle index + reading order

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/README.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/README.md).
- **Relevance:** entry point. Confirms focus group is "Mode 5" and a ~1–2 day effort if reusing bundled components.

### Webhook contract (focus group payload + credits)

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/WEBHOOK-CONTRACT.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/WEBHOOK-CONTRACT.md).
- **Relevance:** documents the single-call `focus_group: true` payload shape (Mode 5) and the credit costs (`focus_group: 2 credits per participant`). We intentionally use the client-side fan-out approach (one `persona_mode: true` call per participant) instead of single-call to keep the visible turn-taking UX.

### Focus Group view — orchestration template

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/FocusGroupView.tsx](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/FocusGroupView.tsx).
- **Relevance:** canonical implementation of the round-execution loop. Lines 128–278 are the model for `useFocusGroupRound.executeRound`.
- **Key patterns:** atomic pre-flight credit deduction (lines 134–160), prior-context splicing (lines 162–169), per-round `OTHER PARTICIPANTS IN THIS ROUND SAID` enrichment (lines 180–186), `STANCE_MODIFIERS` (lines 91–96), per-participant `persona_mode: true` payload (lines 209–224).

### Focus Group setup — picker + cost preview

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/FocusGroupSetup.tsx](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/FocusGroupSetup.tsx).
- **Relevance:** template for the credit cost preview line (lines 146–155). The picker UI itself is already in our `persona-drawer.tsx`.

### Persona panel — tab structure & active session embed

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/PersonaPanel.tsx](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/components/PersonaPanel.tsx).
- **Relevance:** lines 1003–1085 — how the three tabs (Segments / Custom Audience / Focus Group) coexist in the prototype and how the active focus group session swaps the picker for the active view.
- **Key patterns:** `activeTab` state + conditional swap; active-session card lines 819–895 are the visual reference for our `appliedFocusGroup` chip.

### Bundled types

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/types.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/types.ts).
- **Relevance:** lines 254–288 — `FocusGroupParticipant`, `FocusGroupResponse`, `FocusGroupRound`, `FocusGroupSession`. Port the shapes to our [lib/types.ts](/Users/royalnashef/Desktop/smart-arse/lib/types.ts), substituting `PersonaMock` for `SegmentProfile`.

### Bundled credit constants

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/credits.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/lib/credits.ts).
- **Relevance:** `focus_group_round: 2` constant. Port to a new in-app `lib/credits.ts` as `FOCUS_GROUP_CREDIT_COST_PER_PARTICIPANT = 2` + `getFocusGroupRoundCost(n) = n * 2`.

### Bundled credits routes

- **Location:** [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/credits/consume/route.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/credits/consume/route.ts), [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/credits/balance/route.ts](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/api/credits/balance/route.ts).
- **Relevance:** generic atomic credit-consume pattern. Our app charges credits against `projects.credit_balance` (not an org-wide pool), so we'll keep the project-scoped trigger model but add a focus-group-specific RPC that mirrors this atomic SECURITY DEFINER approach.

## Related prior specs

### Custom audience detail — closest pattern for "build + apply + persist + lock-out other modes"

- **Location:** [agent-os/specs/2026-05-08-0556-custom-audience-detail/](/Users/royalnashef/Desktop/smart-arse/agent-os/specs/2026-05-08-0556-custom-audience-detail/).
- **Relevance:** sibling tab in the same drawer. Plan and shape docs describe how applied-state, payload composition, persistence, and history surfaces were wired for Custom Audience — same pattern we replicate for Focus Group.

### Persona drawer chat — applied persona context

- **Location:** [agent-os/specs/2026-03-18-1400-persona-drawer-chat/](/Users/royalnashef/Desktop/smart-arse/agent-os/specs/2026-03-18-1400-persona-drawer-chat/).
- **Relevance:** earliest spec for the drawer apply/clear semantics that Focus Group must match.
