# Unified Email Templates — Shaping Notes

## Scope

Create a cohesive **smartA.R.S.E.** email design used for all outbound mail:

- **App-generated** (Resend): demo request notification, magic link, rejection, low-credit alerts, access-expiry reminders
- **Supabase Auth** (dashboard templates): reset password, confirm signup, magic link, invite user, change email

Deliverables:

- Shared layout module in `lib/email/` with logo, header, footer, and pill CTAs
- Dev preview page at `/dev/emails` to iterate without sending mail
- Copy-paste Supabase HTML with correct Go template variables (`{{ .SiteURL }}`, `{{ .TokenHash }}`, etc.)

## Decisions

- **Design approach:** Evolve the existing mint-card layout in `lib/demo-access/templates/shared.ts` — add logo and unified footer rather than a full redesign
- **Logo:** Host `client-header-logo.gif` on the app domain (`/client-header-logo.gif`); reference via absolute URL in emails
- **Supabase scope:** All five common auth templates (not reset-only)
- **Preview:** Development-only route; hot reload on code edits; "Copy HTML" for Supabase dashboard paste
- **Deliverability:** Table layout, inline CSS, multipart text+html, meaningful `alt` on logo, consistent From name `smartA.R.S.E.`, no image-only content
- **Single source of truth:** `renderEmailLayout` with `supabaseMode` flag to output Go-template literals for dashboard paste

## Context

- **Visuals:** Four Gmail screenshots of current emails (in `visuals/`):
  - `current-low-credits-email.png` — app layout, plain text link CTA
  - `current-demo-request-email.png` — app layout with Approve/Reject pill buttons
  - `current-demo-rejection-email.png` — app layout, no CTA
  - `current-supabase-reset-password-email.png` — unbranded Supabase default ("Disrupt Insight")
- **References:** `lib/demo-access/templates/shared.ts`, `lib/demo-access/email.ts`, `lib/support-notifications/templates.ts`, `lib/email/send-transactional.ts`, README Supabase email section
- **Product alignment:** smartA.R.S.E. is a professional B2B workspace; transactional emails should match in-app branding and reinforce trust for demo access and account recovery flows

## Standards Applied

- **global/project-conventions** — smartA.R.S.E. branding in user-facing copy; `@/` imports; kebab-case `lib/` files
