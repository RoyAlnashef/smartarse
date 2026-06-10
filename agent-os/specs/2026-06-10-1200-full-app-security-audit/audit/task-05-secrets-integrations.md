# Task 5 — Secrets, Configuration, and Third-Party Integrations

**Status:** Complete | **Date:** 2026-06-10

## Environment Variable Inventory

### Server-only (must never be `NEXT_PUBLIC_*`)

| Variable | Used in | Guard behavior |
|----------|---------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` | Throws if missing |
| `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` | `lib/n8n-webhook-url.ts`, `/api/n8n` | Returns 500 if missing |
| `CHAT_N8N_CALLBACK_SECRET` | `/api/chat/n8n-complete` | Returns 503 if missing |
| `CRON_SECRET` | Cron routes | Returns 503 if missing |
| `DEMO_APPROVAL_SECRET` | `lib/demo-access/tokens.ts` | Tokens null / verify fails |
| `EMAIL_PROVIDER_API_KEY` | `lib/email/send-transactional.ts` | Email send fails gracefully |

### Public (expected in client bundle)

| Variable | Risk |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Expected — RLS protects data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Expected — RLS protects data |
| `NEXT_PUBLIC_APP_URL` | Low — used for link generation |
| `NEXT_PUBLIC_N8N_*` | **SEC-012** — must not be set in production |

## Integration Review

### n8n (`/api/n8n`)

- Webhook URL and secret stay server-side when `N8N_WEBHOOK_URL` is set correctly.
- Proxy requires authenticated chat session.
- Upstream response passed through to client (may leak n8n error details — low).

### Resend email

- API key server-only via `getEmailProviderApiKey()`.
- Dev warning when From/To same mailbox for support notifications.
- No user-controlled HTML in demo notification paths reviewed (templates in `lib/demo-access/email.ts`).

### Vercel Cron (`vercel.json`)

- Four scheduled jobs; all require Bearer `CRON_SECRET`.
- Two routes use shared helper; two duplicate inline logic (**SEC-005**).

## Secret Comparison Patterns

| Endpoint | Pattern | Timing-safe |
|----------|---------|-------------|
| Demo HMAC tokens | HMAC-SHA256 | Yes |
| n8n callback | SHA-256 + timingSafeEqual | Yes |
| Cron (inline) | String `!==` | No (**SEC-013**) |
| Cron (shared helper) | String `!==` | No (**SEC-013**) |

## Findings

| ID | Severity | Summary |
|----|----------|---------|
| SEC-012 | Medium | `NEXT_PUBLIC_N8N_*` fallback exposes webhook URL |
| SEC-013 | Low | Cron secret not timing-safe |
| SEC-014 | Informational | No `.env.example` in repo |

## Archived Incident Reference

Handover README documents n8n JWT leak from inlined secrets in scripts — no inlined secrets found in current app code; env vars used correctly.
