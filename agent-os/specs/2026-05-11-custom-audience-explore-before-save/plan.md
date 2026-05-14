# Custom audience: explore before save

## Progress

| Task | Description | Status |
| ---: | --- | :---: |
| **1** | Save spec documentation | **Done** |
| **2** | Persist and webhook — draft-safe `custom_audience_id` | **Done** |
| **3** | Auto-generated display/save name from parameters | **Done** |
| **4** | Builder footer — new (Explore + Save + Cancel) vs edit (Save + Cancel) | **Done** |
| **5** | Live card — draft state CTAs + upgrade without wiping chat | **Done** |
| **6** | QA / edge cases | **Done** (re-verify in app after deploy) |

**Legend:** **Done** = shipped in repo · **Todo** = not started · **In progress** = use this label while actively working a task. Update the table and each task heading when status changes.

---

## Task 1 — **Done** · Save spec documentation

Create [`agent-os/specs/2026-05-11-custom-audience-explore-before-save/`](agent-os/specs/2026-05-11-custom-audience-explore-before-save/) with:

| File            | Purpose                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan.md`       | This plan (tasks + technical notes)                                                                                                                                                                                 |
| `shape.md`      | Scope, decisions (incl. parameter-based auto-name), context                                                                                                                                                         |
| `standards.md`  | [agent-os/standards/global/project-conventions.md](../../standards/global/project-conventions.md) (imports, `cn`, client boundaries, toasts)                                                                     |
| `references.md` | Pointers below                                                                                                                                                                                                      |
| `visuals/`      | Copy provided assets into this folder: workspace `assets/image-e5d813fb-8545-4a49-892a-7a0dccd0ff28.png`, `assets/image-3c569629-8c95-46a9-b3fc-72193fcf07d8.png`, plus earlier builder/detail refs if still useful |

**References** (for `references.md`):

- [`components/client/project-detail/persona-drawer.tsx`](../../../components/client/project-detail/persona-drawer.tsx) — `applyCurrentAudienceDraft`, `saveAudienceDraft`, new vs `editingAudienceId` footer, `CustomAudienceLiveCard`, applied-audience tab body (~1142–1183).
- [`app/client/projects/[id]/page.tsx`](../../../app/client/projects/[id]/page.tsx) — `handleApplyCustomAudience` (clears thread), `sendChatMessage` / `activeChatContextMode`, `appliedCustomAudience` state.
- [`hooks/useChatQuestion.ts`](../../../hooks/useChatQuestion.ts) — `postPersist` + webhook payload `custom_audience`; `chatContextMode` must stay `custom_audience` when id is null but denorm fields are set (page already passes explicit mode).
- [`lib/chat-restore-custom-audience.ts`](../../../lib/chat-restore-custom-audience.ts) — `ghostCustomAudienceFromChatRow`, `isArchivedCustomAudienceId`; add sibling helper `isDraftCustomAudienceId` (e.g. `id.startsWith("draft-")`).
- [`app/api/chat/persist/route.ts`](../../../app/api/chat/persist/route.ts) — `custom_audience_id` is **UUID**; DB column is FK to `project_custom_audiences` ([migration](../../../supabase/migrations/202605072335_custom_audience_persistence_and_chat_metadata.sql)). Non-UUID draft ids **must not** be sent to persist.

---

## Task 2 — **Done** · Persist and webhook — draft-safe `custom_audience_id`

- Add a small helper (e.g. in `lib/` or next to existing chat helpers): **`uuidOrNullForPersist(id: string | null | undefined): string | null`** — return the id only if it parses as UUID, else `null`.
- In [`hooks/useChatQuestion.ts`](../../../hooks/useChatQuestion.ts), for both `postPersist` calls (pending + final), set `custom_audience_id: uuidOrNullForPersist(customAudience?.id)` instead of raw `customAudience?.id`.
- Keep sending denormalized fields (`custom_audience_name`, child segment ids/names/tokens) and `chat_context_mode: "custom_audience"` so history restore via [`ghostCustomAudienceFromChatRow`](../../../lib/chat-restore-custom-audience.ts) continues to work when `custom_audience_id` is null.
- Webhook payload: pass `custom_audience.id` as null when not a UUID (same helper), so n8n never receives `draft-*` as a UUID.

---

## Task 3 — **Done** · Auto-generated display/save name from parameters

**Decision (user):** Option B — auto-generate the stored name when the user did not enter one, **using data from the parameters** of the temp audience (not a generic date-only label).

**Implementation sketch** (single function used when persisting a “still unnamed” audience, e.g. `audienceNameDraft.trim()` empty):

- Inputs: same [`AudienceBuilderDraft`](../../../components/client/project-detail/persona-drawer.tsx) shape used by `draftToSnapshot` (segment ids, country, gender, age range, concern range) plus computed **`customAudienceN`** and **`customAudienceAvgConcern`** (or derive from draft helpers already used: `dominantPersonaForDraft`, `weightedAvgConcernFromDraft`, `surveyLineForLiveAudience`-style bits).
- Name recipe (keep under API max **300** chars, trim sensibly):
  - **Primary:** dominant segment title from `dominantPersonaForDraft` (e.g. “The Muddled Middle Majority”).
  - **Secondary tokens:** `n=<customAudienceN>`, optional `avg concern ≈ X.X/10`, optional short geo/gender/age/concern chips (e.g. `UK · Male · 18–65 · concern 4–8`) only if space allows.
  - **De-dupe / collision:** if this exact string already exists in `savedAudiences` for the project, append a short suffix (`· 2`, timestamp fragment, or first 8 chars of a hash of snapshot) so POST does not violate uniqueness if the DB enforces it (verify [`createSavedCustomAudience`](../../../lib/supabase/custom-audiences.ts) / migration for unique constraints; if none, still avoid confusing identical labels in UI).

Use this string for:

1. The **POST** `name` when saving without a typed name.
2. Optionally align the **draft object’s `name`** after save when upgrading state (see Task 5).

If the user **did** type a name, keep current behavior: use their trimmed name.

---

## Task 4 — **Done** · Builder footer — new vs edit CTAs

In [`persona-drawer.tsx`](../../../components/client/project-detail/persona-drawer.tsx), for **`!editingAudienceId`** (new audience) branch (~1623–1653):

- Replace single **Save + Explore** with stacked CTAs for **new** audiences: **Explore Audience**, **Save Audience**, **Cancel**. When **editing** a saved audience, only **Save Audience** and **Cancel** (no Explore — apply from list or builder new flow). Reuse lucide icons (`Compass`, `Bookmark`) on Explore/Save where shown.
- **Explore:** call `applyCurrentAudienceDraft()`; **do not** require `audienceNameDraft.trim()`; still require `customAudienceN >= 50` and not disabled. Placeholder name stays as today inside `applyCurrentAudienceDraft` (`"Unsaved Audience"` or improve to a **preview-only** label derived from Task 3 function without persisting — optional polish).
- **Save:** `saveAudienceDraft()` — if name empty, pass **parameter-generated name** into the payload (either set draft state once before POST or add optional `nameOverride` to `saveAudienceDraft`). After successful save, return to list (`setAudienceView("list")`) as today.
- **Cancel:** unchanged.

---

## Task 5 — **Done** · Live card — draft state CTAs + upgrade without wiping chat

- Add **`isDraftCustomAudienceId`** in [`lib/chat-restore-custom-audience.ts`](../../../lib/chat-restore-custom-audience.ts) (or adjacent) and use it wherever we need “temporary applied audience” (not archived ghost).
- Extend **`CustomAudienceLiveCard`** (or a thin wrapper in the applied-audience section ~1163+) to accept optional props when `isDraftCustomAudienceId(audience.id)`:
  - **Save this audience** — runs save; if name empty, use Task 3 generator for POST body.
  - **End session** (or match existing copy for clear context) — `onClearCustomAudience?.()`.
- **Critical:** Saving from the card must **replace** `appliedCustomAudience` with the saved row **without** clearing messages or changing `sessionId` / `activeThreadRequestId`.

**Parent wiring** in [`app/client/projects/[id]/page.tsx`](../../../app/client/projects/[id]/page.tsx):

- New callback, e.g. **`onReplaceAppliedCustomAudience(saved: SavedCustomAudience)`** — `setAppliedCustomAudience(saved)` only (no message reset, no new session).
- Pass it into [`PersonaDrawer` / `PersonaPanel`](../../../components/client/project-detail/persona-drawer.tsx) and [`mobile-persona-drawer.tsx`](../../../components/client/project-detail/mobile-persona-drawer.tsx) / [`project-sidebar-tabs.tsx`](../../../components/client/project-detail/project-sidebar-tabs.tsx) as needed.

After upgrade, subsequent `postPersist` calls send the **real UUID** for `custom_audience_id`; earlier rows in the thread may still have null id but same denorm — acceptable; optional follow-up (out of scope unless required) would be anchor backfill.

---

## Task 6 — **Done** · QA / edge cases

- New audience: Explore with empty name → chat works, DB rows get `custom_audience_id: null`, mode `custom_audience`, denorm populated.
- Save from card with empty name → POST receives parameter-based name; list shows new row; chip updates to saved id; new messages persist UUID.
- Saved cap, `n < 50`, and delete flows unchanged.
- Thread load from history: null `custom_audience_id` + custom mode still hydrates ghost audience (existing logic).
- **Draft explore history:** `chat_results.show_in_chat_history` is `false` for draft custom-audience explore turns until the audience is saved; `GET /api/chat/history` and project chat counts filter to `show_in_chat_history = true`. Saving from the live card or builder **promotes** the anchor row (`POST /api/chat/promote-draft-custom-audience-thread`): real `custom_audience_id`, denorm refresh, `show_in_chat_history: true`. Deleting a saved audience still leaves prior threads visible (`show_in_chat_history` stays true; FK nulls via `on delete set null`). Draft explore bypasses the saved-audience cap by design (unsaved threads do not consume a saved slot; each explore session can still create many hidden rows until saved).

---

## Plan structure check (shape-spec)

Task 1 (**Done**) saves all shaping work; Tasks 2–6 are implemented in-repo (**Done** in [Progress](#progress))—re-run the Task 6 checklist in the deployed app when validating a release.
