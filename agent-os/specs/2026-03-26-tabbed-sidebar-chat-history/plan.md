# Tabbed right sidebar + chat history — execution checklist

Condensed from the product plan (see [`shape.md`](shape.md) for scope and [`references.md`](references.md) for file pointers).

## Documentation (this folder)

- [x] `plan.md`, `shape.md`, `standards.md`, `references.md`, `visuals/` (reference screenshots).

## UI primitives

- [ ] **`TabsList` line variant** — `components/ui/tabs.tsx`: `variant` `default` | `line` (cva pattern like `button.tsx`); default unchanged for existing pill tabs inside `PersonaPanel`.

## Right column shell

- [ ] **Tabbed shell** (e.g. `project-right-sidebar.tsx`): pink-bordered shell (`PERSONA_CHAT_SHELL_CLASS` / `border-arse-pink`); `Tabs` `defaultValue="chat-history"`; line tabs: Chat History, Personas, Studio.
- [ ] **Chat History** tab: wire `ChatHistorySidebar` (after lib/hooks/API exist); until then placeholder + empty copy per spec.
- [ ] **Personas** tab: `PersonaPanel` **without** `onCollapseToRail` (chevron hidden when prop omitted).
- [ ] **Studio** tab: empty state (same `EmptyPane`-style pattern as persona drawer).
- [ ] Layout: `flex min-h-0 flex-1 flex-col` on `Tabs`; content `min-h-0 flex-1 overflow-hidden`.

## Page + mobile

- [ ] **`page.tsx`**: remove `personasColumnCollapsed` / narrow rail; fixed `lg` grid `minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)`; use tabbed shell instead of `PersonasColumn` (or thin re-export).
- [ ] **Mobile**: same inner tabbed component in `mobile-persona-drawer.tsx`; **`project-chat.tsx`** trigger label/aria reflects panel scope (not “Personas” only).

## Backend + data

- [ ] **API routes**: `GET /api/chat/history?page=`, `GET /api/chat/poll`, `POST /api/chat/claim` — align with [`chat-history-spec.md`](../../product/dev-notes/chat-history-spec.md) and Supabase session.
- [ ] **Lib + hooks**: `lib/chat-history.ts`, `lib/sanitise.ts`, `lib/group-by-date.ts`; `hooks/useChatHistory.ts`, `hooks/useRerunQuestion.ts` (env `NEXT_PUBLIC_N8N_URL`, timeouts, poll backoff per spec).
- [ ] **Components**: `components/chat/*` — `ChatHistorySidebar`, `HistoryGroup`, `HistoryItem`, `HistoryItemSkeleton`.
- [ ] **Page integration**: `sessionId` via `useRef(crypto.randomUUID())`; pass `orgId` from profile; fetch `GET /api/org/settings`; extend `onQuestionResult` / messages; `refresh()` after answer + re-run; 401 → login.

## QA (high level)

- [ ] Line tabs: active underline, inactive muted; inner Segments/Audience/Focus tabs unchanged.
- [ ] No collapse rail; stable `lg` grid.
- [ ] Mobile: opens Chat History; tabs + persona apply/clear work.
- [ ] History: skeleton, empty, pagination, error/retry, re-run row disable; `org_id` in webhook JSON verified.
