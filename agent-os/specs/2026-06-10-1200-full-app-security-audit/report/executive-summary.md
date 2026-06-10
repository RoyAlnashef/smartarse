# smartA.R.S.E. — Security Audit Executive Summary

**Application:** smartA.R.S.E. (Next.js + Supabase)  
**Audit date:** 10 June 2026  
**Audit type:** Full static code review  
**Report version:** 2.0 (signed off)  
**Sign-off date:** 10 June 2026  
**Prepared for:** Client stakeholder handoff

---

## 1. Purpose and Scope

This report summarises a **full static security audit** of the smartA.R.S.E. web application. The review covered authentication, authorisation, API routes, database row-level security (RLS), secrets handling, input validation, client-side controls, and third-party dependencies.

**In scope**

- ~35 API routes (admin, chat, demo, cron, integrations)
- Supabase Auth, PostgreSQL RLS, and storage policies (48 migrations)
- Integrations: n8n webhooks, Resend email, Vercel Cron
- Dependency scan (`pnpm audit`)

**Out of scope**

- Live penetration testing / dynamic application scanning
- Review of Vercel or Supabase dashboard configuration
- Formal compliance certification (SOC 2, ISO 27001)

---

## 2. Methodology

Auditors performed manual source-code review against OWASP-oriented checklists. Each API route was traced to its authentication helper. RLS policies and SECURITY DEFINER functions were reviewed in SQL migrations. Findings were classified by severity and assigned unique IDs (SEC-001 through SEC-022).

No exploitation was attempted against a running environment. Findings reflect **code and configuration patterns in the repository** as of the audit date.

Detailed evidence and remediation steps are in the [Technical Appendix](./technical-appendix.md).

---

## 3. System Overview

smartA.R.S.E. is a project-centric research workspace. Users authenticate via **Supabase Auth** (email/password and magic links). The Next.js application serves two main experiences:

- **Admin dashboard** — organisations, users, projects, demo requests, platform settings
- **Client workspace** — project chat, documents, focus groups, custom audiences

**Data isolation** is enforced primarily by **Supabase RLS** (organisation and project scoping) and by **server-side API guards** that verify the caller's role before using elevated database access.

**External services**

| Service | Role |
|---------|------|
| Supabase | Auth, database, file storage |
| n8n | AI chat workflow webhooks |
| Resend | Transactional email (demo approvals, notifications) |
| Vercel Cron | Scheduled maintenance (pause expired projects, expire demo requests) |

Architecture diagrams: [`../visuals/README.md`](../visuals/README.md).

---

## 4. Overall Assessment

The application has a **solid security foundation**. Following the June 2026 audit, **19 of 22 findings were remediated in code**; 3 are documented accepted risks (shared-secret callback design, email-link GET pattern, CSRF posture).

Sensitive operations remain gated by server-side authentication helpers, admin routes require verified admin role before service-role database access, and Supabase RLS provides meaningful org/project isolation.

---

## 5. Risk Summary (post-remediation)

| Severity | Found | Fixed | Accepted risk |
|----------|------:|------:|--------------:|
| Critical | 1 | 1 | 0 |
| High | 6 | 5 | 1 |
| Medium | 9 | 9 | 0 |
| Low | 4 | 3 | 1 |
| Informational | 2 | 1 | 1 |
| **Total** | **22** | **19** | **3** |

---

## 6. Top Priorities

These items should be addressed first. They carry the highest impact for production deployments.

| Priority | ID | Issue | Why it matters |
|----------|-----|-------|----------------|
| 1 | SEC-001 | Role derived from JWT metadata when user profile cannot be loaded | Users may see the wrong admin/client interface if database RLS is misconfigured |
| 2 | SEC-002 | Mock login without password when Supabase is not configured | Total auth bypass if environment variables are missing in production |
| 3 | SEC-019 | Outdated Next.js (16.1.6) | Published HIGH severity advisories; patch available (≥16.2.5) |
| 4 | SEC-008 | n8n callback secret grants broad write access | Leaked secret could allow forged chat data across organisations |
| 5 | SEC-012 | Webhook URL can be exposed via public env vars | Infrastructure endpoint visible in browser bundle if misconfigured |
| 6 | SEC-007 | Chat proxy forwards unvalidated payloads to n8n | Authenticated users could abuse upstream workflow |
| 7 | SEC-010 | Legacy chat rows visible org-wide | Chat queries without project scope readable by all org members |
| 8 | SEC-015 | Demo role switcher visible in production UI | Does not bypass security but creates confusion and testing risk |

---

## 7. Client action required

All required client actions are **complete**:

- Supabase migration `202606101300_security_audit_rls_hardening.sql` — **applied**
- Code remediations — **in repository**

**Before production deploy**, confirm:

1. Environment variables match [`.env.example`](../../../../.env.example) (no `NEXT_PUBLIC_N8N_*` vars).
2. Integration secrets are set and rotated if previously exposed.
3. Application build deployed with Next.js 16.2.6+.

## 8. Audit programme status

**Complete.** Verification details: [`audit/task-09-verification.md`](../audit/task-09-verification.md).

## 9. Residual risk statement

After planned remediation, **residual risk** will remain in areas typical for this architecture:

- **Shared secrets** — cron, n8n callback, and email approval links depend on secret confidentiality and rotation discipline
- **Service-role API routes** — elevated database access is intentional; security relies on correct API-level validation
- **Client-side routing** — UI role checks are convenience layers; RLS and API guards are the authoritative controls
- **Third-party dependencies** — ongoing dependency monitoring required

A follow-up report (version 2.0) will be issued after remediation and verification (Task 9), updating finding statuses and residual risk.

---

## 9. Related Documents

| Document | Audience |
|----------|----------|
| [Technical Appendix](./technical-appendix.md) | Engineering — full finding details |
| [Findings register](../audit/findings.md) | Internal — working copy |
| [Audit task notes](../audit/) | Internal — per-area review notes |
| [Architecture visuals](../visuals/README.md) | All — system diagrams |

---

*This document is intended for client stakeholders. For implementation detail, refer to the Technical Appendix.*
