# Task 3 — API Route Authorization Audit

**Status:** Complete | **Date:** 2026-06-10

## Route Auth Matrix

| Route | Method | Auth mechanism | Service role | Notes |
|-------|--------|----------------|--------------|-------|
| `/api/admin/users` | POST | `requireDashboardAdmin` | Yes | Zod body validation |
| `/api/admin/users/[id]` | DELETE | `requireDashboardAdmin` | Yes | UUID validated |
| `/api/admin/demo-requests` | GET | `requireDashboardAdmin` | Yes | |
| `/api/admin/demo-requests/[id]/approve` | POST | `requireDashboardAdmin` | Yes | **SEC-006** — id not UUID-validated |
| `/api/admin/demo-requests/[id]/reject` | POST | `requireDashboardAdmin` | Yes | **SEC-006** |
| `/api/admin/demo-project` | GET/PUT/DELETE | `requireDashboardAdmin` | Yes | Zod on PUT |
| `/api/admin/platform-settings` | GET/PATCH | `requireDashboardAdmin` | Yes | Manual validation |
| `/api/admin/projects/[id]/chat-history` | GET | `requireDashboardAdmin` | Yes | UUID validated |
| `/api/admin/projects/[id]/chat-result` | GET | `requireDashboardAdmin` | Yes | UUID validated |
| `/api/admin/projects/[id]/focus-group-session` | GET | `requireDashboardAdmin` | Yes | UUID validated |
| `/api/admin/projects/[id]/evaluate-credit-alert` | POST | `requireDashboardAdmin` | Yes | |
| `/api/cron/pause-expired-projects` | GET | Inline `CRON_SECRET` | Yes | **SEC-005, SEC-013** |
| `/api/cron/expire-demo-requests` | GET | Inline `CRON_SECRET` | Yes | **SEC-005, SEC-013** |
| `/api/cron/support-notifications` | GET | `authorizeCronRequest` | Yes | Good pattern |
| `/api/cron/support-notifications-outbox` | GET | `authorizeCronRequest` | Yes | Good pattern |
| `/api/n8n` | POST | `requireChatSession` | No (proxies) | **SEC-007** |
| `/api/chat/persist` | POST | `requireChatSession` | Yes (writes) | Project checked via user client + RLS |
| `/api/chat/poll` | GET | `requireChatSession` | No | `user_id` ownership check |
| `/api/chat/result` | GET | `requireChatSession` | No | UUID + ownership |
| `/api/chat/history` | GET | `requireChatSession` | No | Scoped to `profile.id` |
| `/api/chat/cancel` | POST | `requireChatSession` | Yes | |
| `/api/chat/n8n-complete` | POST | Callback secret | Yes | **SEC-008** — Zod + org checks |
| `/api/chat/promote-draft-*` | POST | `requireChatSession` | Yes | |
| `/api/focus-group/sessions` | POST | `requireChatSession` | No | |
| `/api/focus-group/sessions/[id]` | GET | `requireChatSession` | No | |
| `/api/focus-group/sessions/[id]/end` | POST | `requireChatSession` | No | |
| `/api/audience/saved` | GET/POST | `requireChatSession` | No | RLS on writes |
| `/api/audience/saved/[id]` | GET/PATCH/DELETE | `requireChatSession` | No | UUID validated |
| `/api/credits/charge-focus-group-round` | POST | `requireChatSession` | No | RPC via user client |
| `/api/demo/request` | POST | None (public) | Yes | Rate limited; anti-enumeration |
| `/api/demo/approve` | GET | HMAC token | Yes | **SEC-009** |
| `/api/demo/reject` | GET | HMAC token | Yes | **SEC-009** |
| `/api/demo/session` | GET | Session cookie | Yes (read) | Scoped by `user.id` |
| `/api/demo/record-first-login` | POST | Session cookie | Yes | |
| `/api/demo/complete-password-setup` | POST | Session + demo metadata | Yes | Checks `demo_user` flag |

## IDOR Analysis

- **Chat poll/result:** Returns 202 if row missing or wrong `user_id` — no cross-user leak.
- **Chat persist:** Project fetched via user-scoped Supabase client; RLS prevents cross-org project access.
- **Admin project routes:** Service role after admin check — intentional full access.
- **Audience saved:** RLS on `project_custom_audiences` restricts by creator/org (see Task 4).

## Findings

| ID | Severity | Summary |
|----|----------|---------|
| SEC-005 | Medium | Cron auth duplicated, not using shared helper |
| SEC-006 | Low | Admin demo `[id]` routes skip UUID validation |
| SEC-007 | Medium | n8n proxy forwards unvalidated body |
| SEC-008 | High | Callback secret compromise → cross-user chat writes |
| SEC-009 | Low | GET side effects on demo approve/reject |

## Conclusion

No unauthenticated access to admin or chat routes. Public surface limited to demo request + HMAC email links. Primary risks are shared-secret blast radius (cron, n8n callback) and n8n proxy validation.
