# Standards excerpts — handover survey citations

Relevant global rules for extending types, parsing Disrupt payloads, and implementing tooltip UI. Full documents live under [`agent-os/standards/global/`](../../standards/global/).

---

## From [`domain-data-layer.md`](../../standards/global/domain-data-layer.md)

### Source of truth

- **Types:** `lib/types.ts` — entities and chat shapes should align here first.
- **Mock seed:** `lib/mock-data.ts` — mirror production shapes when mocks are in use.

### When adding fields

1. Update `lib/types.ts`.
2. Update mock rows + any filters if behaviour changes.
3. Plan migration for Supabase columns + RLS when persistence changes.

### Chat discipline (interpretation for this spec)

- Extend **`lib/types.ts`** and **payload parsing in one place** (`lib/api/chat-payload.ts`) so n8n / Disrupt JSON maps cleanly to client shapes.
- **`chat_results.result_payload`** remains **backward compatible**: new fields are optional; legacy rows without `inline_citations` or per-message citations continue to render via documented fallbacks.

---

## From [`project-conventions.md`](../../standards/global/project-conventions.md)

### Imports

- Use the **`@/`** alias for `app/`, `components/`, `lib/` — avoid long `../../../` chains across those roots.

### Class merging

- Use **`cn(...inputs)`** (`clsx` + `tailwind-merge`) for composable `className` on tooltip wrappers and layout.

### Client vs server

- **`"use client"`** only where hooks, browser APIs, or event handlers are required; keep server boundaries clear for any future RSC-friendly splits.

### File naming

- Components: **PascalCase** (e.g. `MessageBubble.tsx`).
- Utilities in `lib/`: **kebab-case** (e.g. `chat-payload.ts`, future `survey-codes.ts`).

---

## Cross-reference

- Standards registry: [`agent-os/standards/index.yml`](../../standards/index.yml).
