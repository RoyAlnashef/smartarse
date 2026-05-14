# Standards — Persona segment display bindings

Cross-cutting conventions for this workstream.

---

## global/domain-data-layer (types + migration discipline)

Source: [agent-os/standards/global/domain-data-layer.md](../../standards/global/domain-data-layer.md)

### Source of truth

- **Types**: `lib/types.ts` — entities and fields agents and Supabase schemas should align with.
- **Mock seed**: `lib/mock-data.ts` — until or unless replaced, lists mirror production shapes.

### IDs

- String IDs (`u1`, `c1`, `p1`, …) in mock — **replace with UUIDs** in Supabase for entity primary keys; keep TypeScript as `string`.
- **Segment ids** for this feature remain the existing **canonical slug strings** (not UUIDs); new columns reference those slugs, not new identifiers.

### When adding fields

1. Update `lib/types.ts` (and JSDoc mapping to DB snake_case where applicable).
2. Update mock rows and any filters or visibility helpers if behavior changes.
3. Ship a **Supabase migration** for columns, constraints (CHECK, UNIQUE), comments, and RLS review.

### Chat / credits (context)

- Credits live on **Project** (and organization summary in mock). Server decrements on AI calls; client display is read-only beyond MVP shell.

---

## global/project-conventions (implementation hygiene)

For day-to-day code style (imports, `cn`, client boundaries, toasts), follow [agent-os/standards/global/project-conventions.md](../../standards/global/project-conventions.md): **`@/`** imports, `cn()` for class merging, `"use client"` only where needed, `sonner` for feedback.
