# Focus Groups MVP — Shaping Notes

## Scope

Build the Focus Group panel under the right-rail Personas drawer so end users can convene a 2–4 participant virtual focus group across segment personas, debate a topic across multiple rounds, and see the conversation thread inline in the chat transcript. The feature must:

- Reuse the existing Focus Group tab UI scaffold already present in [`persona-drawer.tsx`](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx) (picker, country pills, topic textarea, Start button) and complete its wiring.
- Render an active Focus Group card in the drawer (mirroring the supplied screenshot) with participant chips, Rounds/Voices counters, and an End Focus Group button.
- Charge `2 credits × participants` atomically per round through a new Supabase RPC, never double-charging via the existing per-row chat trigger.
- Fan out to the live n8n webhook sequentially per participant with `persona_mode: true` and an enriched persona brief that includes prior rounds and the other participants' current-round answers.
- Persist each participant response as a `chat_results` row tagged with `focus_group_session_id`, `focus_group_round_number`, `focus_group_participant_index`, and `chat_context_mode = "focus_group"`.
- Surface a focus-group badge in the chat history card and group history rows by session.
- Keep the three personas tabs (Segments, Custom Audience, Focus Group) mutually exclusive — entering one mode locks the others.

Scope is limited to the Must-Have user stories. Real-interviewee participants, simulation mode, mid-session participant removal, and full live re-restoration of historical sessions are out of scope.

## Decisions

- **Credit model = match prototype exactly** — `2 credits × participants` per round, atomic pre-deduction via new `apply_project_credit_for_focus_group_round` RPC. The existing `chat_results_apply_project_credit` trigger ([`202604132000_chat_results_project_credit_charge.sql`](/Users/royalnashef/Desktop/smart-arse/supabase/migrations/202604132000_chat_results_project_credit_charge.sql)) must be updated to skip rows with `focus_group_session_id is not null` so per-response rows do not double-charge.
- **Webhook integration = live n8n with client-side fan-out** — one `persona_mode: true` call per participant per round (sequential), reusing the polling/cancel infrastructure from [`useChatQuestion.ts`](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts) but in a new `useFocusGroupRound` hook because of pre-flight credit deduction + multi-call orchestration.
- **Persistence = extend `chat_results`** with new nullable focus group columns + a parent `focus_group_sessions` table for the session shell (participants, country context, initial topic, ended_at). Each round shares a `thread_anchor_request_id` so rounds appear grouped in chat history.
- **Tab gating** — reuse the existing `personaLocked` / `customAudienceLocked` mutual-exclusion gating already present in [`persona-drawer.tsx`](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx) (lines 1268–1296), adding a third `focusGroupLocked` flag.
- **No credit refunds for partial failures** — matches prototype behavior; failed participant calls insert a placeholder bubble.
- **No citation rendering** for focus group responses — they're opinions, not RAG-grounded answers.

## Context

- **Visuals:**
  - `visuals/01-active-state-with-sidebar-card.png` — supplied prototype screenshot showing an active focus group: "Virtual Focus Group" header in main pane, Round 1 transcript with The Do Nothing-ers + The Minimalists, and the right-rail "Focus Group" card with participant chips, "Rounds: 1", "Voices: 2", and "End Focus Group" button. This is the primary visual reference for the active state.
  - Two earlier shaping screenshots (prototype Focus Group setup pane in desktop and mobile widths) were reviewed inline during the shaping session but were not persisted to disk for archival. The current app already implements an equivalent setup pane in [`persona-drawer.tsx`](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx) lines 1865–1987 and that scaffold is what we'll extend.
- **References:** see [`references.md`](./references.md). The handover bundle at [`agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/`](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/) is the authoritative behavioral source; the in-app references are the wiring patterns to mirror.
- **Product alignment:** focus groups are an MVP target persona feature alongside Segments and Custom Audiences, aligned with [`agent-os/product/mission.md`](/Users/royalnashef/Desktop/smart-arse/agent-os/product/mission.md) and the hybrid Supabase + n8n integration goal in [`agent-os/product/roadmap.md`](/Users/royalnashef/Desktop/smart-arse/agent-os/product/roadmap.md).

## Standards Applied

- `global/domain-data-layer` — adding new entities (`FocusGroupSession`, `FocusGroupRound`, `FocusGroupResponse`, `FocusGroupParticipant`) to [`lib/types.ts`](/Users/royalnashef/Desktop/smart-arse/lib/types.ts), aligned Supabase migrations, and credits stay on Project per the standard's "Chat / credits" guidance.
- `global/project-conventions` — `@/` imports across new files, `cn` for className merging, PascalCase components, kebab-case utilities (`use-focus-group-round.ts` → `useFocusGroupRound`).
- `css/ui-styling` — new chips and round bubbles use existing `components/ui/*` primitives + brand tokens (`arse-black`, `arse-pink`) and `cite-color-tokens` for per-participant color. No new primitives needed.

## Out of Scope

- Real-interviewee (Digital Twin) participants. The type contract supports `isInterviewee`, but the picker only exposes the 4 canonical segments.
- Simulation mode toggle (HIGH/MEDIUM/LOW confidence labelling).
- Removing a participant from a running session.
- Full live re-restoration of a historical focus group into the drawer's active state (we render historical rounds read-only in the transcript; reopening the live drawer state is deferred).
- Per-segment tone variation tuning — we port the prototype's `STANCE_MODIFIERS` map verbatim but don't iterate on copy.
- Refunding credits on partial-round failure.
- Citation chip support for focus group answers — explicitly suppressed.
