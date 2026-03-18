# Client Project Detail — Shaping Notes

## Scope

Build the themed **client Project Detail** screen matching the provided mock:

- Left rail: Project title/overview + Sources selector.
- Main chat canvas: messages + input at bottom.

Include **mock interactions** (no backend):

- Toggle sources selection.
- Send a message and append it to a single active thread.
- Simulate a short assistant reply after a delay.

Include a **responsive + accessibility** pass.

## Decisions

- Use the existing client area patterns from the Project List screen for spacing, fonts, and `arse-*` tokens.
- Reuse chat primitives where possible, but allow client-specific wrappers/styling to match the magenta/cyan theme.
- **No Chat History list** in this iteration (single thread only).

## Context

- **Visuals:** `visuals/project-detail-d65f8e9f-8542-44c4-92a6-f17dc32071e5.png`
- **References:** see `references.md`
- **Product alignment:** project-centric chat with explicit document selection; mock data until Supabase/AI integration.

## Standards Applied

- `css/ui-styling` — component layering, tokens, focus styles
- `global/project-conventions` — `@/` imports, `cn`, client boundaries
- `global/app-routing-protected-shell` — redirect patterns (client layout handles auth)
- `global/domain-data-layer` — align with `lib/types.ts` + `lib/mock-data.ts`

