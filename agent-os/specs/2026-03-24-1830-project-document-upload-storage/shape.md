# Project document upload and storage — Shaping notes

## Scope

- **Phase A (first implementation):** Admin-facing **project Documents** tab: full upload **state machine** (idle, validation errors, simulated byte progress, processing → ready, delete, optional error path) using in-memory state that **resets on reload**. No Supabase Storage yet.
- **Phase B:** Supabase **private bucket** + **metadata table** + **RLS**, then wire admin list/upload/delete and client **Sources** to the same data so smartA.R.S.E. chat can use document context consistently.
- **Phase C (parity hardening):** Ensure client project detail uses the same resolved ready-document subset for Sources display and chat `documentIds`, with mock fallback preserved.

## Decisions

- Use **Supabase Storage** for file bytes; Postgres for searchable metadata and status (processing/ready/error), aligned with [lib/types.ts](../../../lib/types.ts) `UploadedFile`.
- **Documents tab** remains **admin-only** (existing `tabs` filter); whether **client** role may upload later is an open product choice affecting RLS.
- Global **`/documents`** page: **no upload** in Phase A; optional follow-up to add “+ Upload” with project picker.
- Mock uploads on the admin project page **do not sync** to the client Sources panel until Phase B (no shared session store).
- Client Sources parity uses a single resolved document list in the client page to avoid divergence between displayed files and chat context IDs.

## Context

- **Visuals:** [visuals/](./visuals/) — dashboard project Documents tab, Supabase buckets, global documents table, client Sources empty state.
- **References:** See [references.md](./references.md).
- **Product alignment:** [agent-os/product/tech-stack.md](../../product/tech-stack.md) — Supabase + Next; documents support research/chat context ([mission.md](../../product/mission.md)).

## Phase 3 validation focus

- Same project should show aligned document names between admin dashboard and client Sources.
- When no ready docs exist, client Sources keeps existing empty-state behavior.
- If Supabase/session is unavailable, client page continues using mock document fallback.

## Standards applied

- **domain-data-layer** — `UploadedFile`, migrations, relations Project ↔ files.
- **auth-rbac** — Admin-only tab; future server-side enforcement via RLS.
- **project-conventions** — `@/` imports, `sonner`, client boundaries.
- **ui-styling** — shadcn primitives, `mint-*` / `dark-*` tokens.

Full text: [standards.md](./standards.md).
