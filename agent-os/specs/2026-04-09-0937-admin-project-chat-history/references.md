# References for Admin Project Chat History

## Similar specs and implementation notes

### Chat history thread load and continue

- **Location:** `agent-os/specs/2026-04-01-1600-chat-history-thread-load-continue/`
- **Relevance:** Defines history click behavior, thread hydration, and continuation model anchored on `request_id`.
- **Key patterns:** Distinct history/result APIs, no re-run on history click, hydration from stored payload.

### Project chat n8n integration

- **Location:** `agent-os/specs/2026-03-26-1400-project-chat-n8n-integration/`
- **Relevance:** Captures webhook contracts and persistence model (`chat_results`) used by history reads.
- **Key patterns:** `request_id` ownership/idempotency, read paths via Next.js APIs, smoke-test expectations.

## Code touchpoints studied

- `app/(dashboard)/projects/[id]/page.tsx` - current admin chat tab is mock/local state.
- `app/client/projects/[id]/page.tsx` - existing real history load + thread hydration behavior.
- `app/api/chat/history/route.ts` - current self-history API.
- `app/api/chat/result/route.ts` - current self-result fetch API.
- `lib/api/require-chat-session.ts` and `lib/api/require-dashboard-admin.ts` - role/auth guard patterns.
- `components/chat/chat-sidebar.tsx` and `components/chat/chat-window.tsx` - dashboard chat UI primitives.
