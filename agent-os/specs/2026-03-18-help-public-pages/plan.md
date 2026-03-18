# Help pages (FAQ, Privacy, Contact) — client-facing

## Context

- **Routes:** Stay under `app/help/` → `/help/faq`, `/help/privacy`, plus new **`/help/contact`**.
- **Existing:** Minimal stubs in `app/help/faq/page.tsx` and `app/help/privacy/page.tsx`. Footers already link FAQ/Privacy in `components/login-page.tsx` and `components/client/client-shell-footer.tsx`; Contact is currently a non-link span.
- **Auth:** `lib/auth-context.tsx` exposes `user`, `isAuthenticated`. Help pages remain **public** (no route gate).

## Architecture

```mermaid
flowchart LR
  subgraph helpArea [help routes]
    layout[app/help/layout.tsx]
    faq[/help/faq]
    privacy[/help/privacy]
    contact[/help/contact]
    layout --> faq
    layout --> privacy
    layout --> contact
  end
  LoginFooter[login-page footer]
  ClientFooter[client-shell-footer]
  LoginFooter --> helpArea
  ClientFooter --> helpArea
```

## Header behavior (new)

Add a **client** header component (e.g. `components/help/help-public-header.tsx`) used only from `app/help/layout.tsx`:

- **Branding row** aligned with client shell styling (`components/client/client-shell-header.tsx` as visual reference).
- **Primary “home” link** (logo/main CTA):
  - **Not authenticated** → `/` (sign-in).
  - **Authenticated client or user** → `/client/projects`.
  - **Authenticated admin** → `/dashboard`.
- **Optional secondary links** use the same “guest goes to `/`” rule.
- **In-section nav** (same tab): FAQ | Privacy | Contact → `/help/faq`, `/help/privacy`, `/help/contact` using `Link` and active styling via `usePathname()`.

Root `app/layout.tsx` already wraps `AuthProvider`, so the header can use `useAuth()`.

## Page content

- **FAQ:** structured sections with plausible placeholder Q&A (easy to replace later).
- **Privacy:** clear sections (data/retention/contact) with placeholder legal-style copy (not legal advice).
- **Contact:** static copy plus `mailto:` link.

## Footers

- **Sign-in** (`components/login-page.tsx`): FAQ, Privacy, **Contact**.
- **Client shell** (`components/client/client-shell-footer.tsx`): same for all three links.
- Footer links navigate in the **same tab** (normal `Link` behavior).

No changes to `(dashboard)` or admin layouts.

## Implementation order (after Task 1)

1. `HelpPublicHeader` + `app/help/layout.tsx` with shared chrome and `{children}`
2. `app/help/contact/page.tsx` (static + mailto)
3. Refresh FAQ and Privacy pages to use the shared layout structure
4. Update sign-in and client footers: FAQ/Privacy/Contact links (same tab) + Contact URL

