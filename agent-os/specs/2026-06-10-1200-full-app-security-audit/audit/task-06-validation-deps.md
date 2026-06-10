# Task 6 — Input Validation, Client Security, and Dependencies

**Status:** Complete | **Date:** 2026-06-10

## Input Validation Summary

| Area | Validation | Assessment |
|------|------------|------------|
| Demo signup | Zod + consent parsers | Strong |
| Admin user create | Zod | Strong |
| Chat persist/cancel/n8n-complete | Zod | Strong |
| Focus group, audience, credits | Zod | Strong |
| Admin platform settings | Manual type checks | Adequate |
| n8n proxy | JSON parse only | **SEC-007** Weak |
| Admin demo `[id]` routes | No UUID check | **SEC-006** |
| Chat poll/result/history | UUID regex | Adequate |
| File uploads | `sanitizeStorageFileName` | **SEC-017** Minimal |

## Client Security

| Control | Location | Assessment |
|---------|----------|------------|
| Admin shell gate | `app/(dashboard)/layout.tsx` | Client-only (**SEC-016**) |
| Client shell gate | `app/client/layout.tsx` | Client-only (**SEC-016**) |
| Demo role switcher | `components/layout/sidebar.tsx` | **SEC-015** — production visible |
| Nav role filtering | `sidebar.tsx` | UI only; APIs enforce |
| Direct Supabase writes | `lib/supabase/*` | RLS-dependent; correct pattern |

## CSRF Posture

Cookie-authenticated POST routes (`/api/chat/*`, `/api/admin/*`, etc.) rely on SameSite cookie behavior. No CSRF tokens (**SEC-018**). Supabase SSR cookies typically use `SameSite=Lax`.

State-changing GET on demo approve/reject mitigated by HMAC secrets in URL.

## Dependency Scan

**Command:** `pnpm audit` (2026-06-10)

**Summary:** 29 vulnerabilities — 1 critical, 11 high, 14 moderate, 3 low

| Package | Installed | Severity | Finding ID |
|---------|-----------|----------|------------|
| `next` | 16.1.6 | High (multiple) | SEC-019 |
| `vitest` | 3.0.5 | Critical (dev) | SEC-020 |
| `lodash` (via recharts) | ≤4.17.23 | High | SEC-021 |
| `picomatch` (via tailwindcss) | various | High | SEC-022 |

Production runtime priorities: **upgrade Next.js first** (SEC-019).

Dev-only: vitest, tailwind/picomatch affect CI and local dev, not production bundle.

## Existing Security Tests

| Test file | Coverage |
|-----------|----------|
| `lib/api/authorize-cron-request.test.ts` | Cron Bearer auth |
| `lib/demo-access/tokens.test.ts` | HMAC tokens |
| `lib/demo-access/config.test.ts` | Env config |
| `lib/supabase/session-from-url.test.ts` | Magic-link parsing |

**Gaps (for Task 8):** No tests for `requireDashboardAdmin`, `requireChatSession`, n8n callback auth, or RLS integration.

## Findings

| ID | Severity | Summary |
|----|----------|---------|
| SEC-007 | Medium | n8n proxy unvalidated body |
| SEC-015 | Medium | Demo role switcher in production |
| SEC-016 | Medium | Client-only layout RBAC |
| SEC-017 | Low | Minimal upload sanitization |
| SEC-018 | Informational | No CSRF tokens |
| SEC-019 | High | Vulnerable Next.js |
| SEC-020 | Critical | Vulnerable Vitest (dev) |
| SEC-021 | High | Lodash via recharts |
| SEC-022 | High | Picomatch ReDoS (transitive) |
