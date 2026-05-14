# Help pages (FAQ, Privacy, Contact) — Shaping Notes

## Scope

Create client-user help pages for:

- `/help/faq`
- `/help/privacy`
- `/help/contact` (new)

These are **public** pages (no dashboard/admin routes touched). We will use the existing `app/help/` directory and keep all admin dashboard code out of scope.

## Decisions

- Keep the help URLs under `/help/*` (not `/app/help/*`), since the repo already uses `/help/faq` and `/help/privacy`.
- “Contact the team” will be a first-version **static** page (no form backend yet) using a `mailto:` link.
- Add a shared `app/help/layout.tsx` that provides:
  - a header visible on all help pages
  - consistent in-section navigation (FAQ/Privacy/Contact)
- The header is **auth-aware for link targets**:
  - if the user is not authenticated, help header “home” links route to the **sign-in page** (`/`)
  - if authenticated as client/user, route to `/client/projects`
  - if authenticated as admin, route to `/dashboard`
- Sign-in and client-user footers link to FAQ/Privacy/Contact in the **same tab**.

## Context

- **Visuals:** none provided.
- **References:**
  - `components/login-page.tsx` (existing sign-in footer links to `/help/faq` and `/help/privacy`)
  - `components/client/client-shell-footer.tsx` (existing client footer links to `/help/faq` and `/help/privacy`)
  - `components/client/client-shell-header.tsx` (used as a visual reference for help header branding)
  - existing stubs: `app/help/faq/page.tsx`, `app/help/privacy/page.tsx`
- **Product alignment:** help pages support navigation + public trust (FAQ/Privacy/Contact) without interfering with admin workflows.

## Standards Applied

- `global/project-conventions.md` — `@/` imports, `cn()` usage, file naming.
- `css/ui-styling.md` — tokens, class patterns, and typography guidance.
- `global/app-routing-protected-shell.md` — redirect/auth UX patterns we mirror for link targets (even though help pages themselves are public).

