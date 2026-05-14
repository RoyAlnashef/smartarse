# Shape: Custom audience — explore before save

## Problem

Users building a custom audience currently face friction between **naming/saving** and **trying the audience in chat**. The product goal is to let them **explore** a draft audience in the project chat first, then **persist** a named row when they choose—without breaking chat history, webhooks, or DB constraints.

## Scope (in)

- **Persist layer:** Send `custom_audience_id` only when the id is a real UUID; keep `chat_context_mode: "custom_audience"` and denormalized audience fields so threads restore correctly when the id is null (draft / ghost).
- **Webhook:** Never send `draft-*` (or other non-UUID) values where downstream expects a UUID.
- **Naming:** When the user leaves the name empty at save time, **auto-generate** the stored name from **audience parameters** (dominant segment, n, optional concern/geo/age chips), capped sensibly (e.g. 300 chars), with collision avoidance against existing saved names for the project.
- **Builder (new audience):** Three actions aligned with the edit branch—**Explore Audience**, **Save Audience**, **Cancel**—with explore **not** requiring a typed name (still require minimum sample size and other existing guards).
- **Live card (draft applied):** Actions to **save** (upgrade to real row without clearing chat) and **end session** / clear applied audience; parent exposes a narrow callback that only replaces `appliedCustomAudience` state.

## Scope (out / deferred)

- Backfilling historical chat rows with a UUID after a late save (“anchor backfill”)—acceptable to defer; mixed null/UUID within one thread is acceptable per plan.

## Key decisions

| Topic | Decision |
| ----- | -------- |
| Empty name at save | **Option B:** Generate display/save name from **parameters** (not date-only placeholder). |
| Draft in DB | Do not send non-UUID ids to `chat/persist`; rely on denorm + mode for restore. |
| Save from live card | Replace applied audience with saved entity **only**—no new session, no message wipe. |
| Builder explore | Same validation as today for sample size; **no** mandatory name before explore. |

## Technical context

- `project_custom_audiences.id` is a UUID FK from chat metadata; draft client ids must be filtered at persist and webhook boundaries.
- Ghost restore already exists (`ghostCustomAudienceFromChatRow`, archived-id handling); draft ids will get an explicit **`isDraftCustomAudienceId`** sibling for UI and branching.
- Implementation spans `persona-drawer.tsx`, project page chat wiring, `useChatQuestion` persist payloads, and small shared helpers in `lib/`.

## Success criteria (high level)

- User can open chat with a draft custom audience and exchange messages with stable session behavior.
- Saving (from builder or live card) creates a list row with a sensible name when none was typed.
- After save from the card, the UI shows the saved audience and new messages persist a real `custom_audience_id`.
