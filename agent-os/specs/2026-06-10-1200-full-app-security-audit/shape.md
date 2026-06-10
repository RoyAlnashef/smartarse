# Full Application Security Audit — Shaping Notes

## Scope

Conduct a **full static security audit** of the smartA.R.S.E. application and deliver a **client-ready report** with remediation of all findings.

**In scope:**

- Authentication and session management (Supabase Auth, middleware, magic links, demo onboarding)
- Authorization (API route guards, RBAC, service-role usage, shared-secret endpoints)
- Data access (Supabase RLS policies, storage policies, SECURITY DEFINER RPCs)
- Secrets and configuration (env vars, third-party integrations)
- Input validation and injection risks
- Client-side security (UI-only guards, exposed public env vars)
- Dependency vulnerabilities (`npm audit`)

**Deliverables:**

1. Executive summary — non-technical overview for client stakeholders
2. Technical appendix — detailed findings with file references, severity, and recommendations
3. Code remediation for all findings (Tasks 8–9)

**Out of scope (unless added later):**

- Dynamic penetration testing / DAST
- Hosted environment dashboard review (Vercel, Supabase console settings)
- Formal compliance certification (SOC 2, ISO 27001)

## Decisions

| Topic | Decision |
|-------|----------|
| Audit type | Full static review — auth/RBAC, APIs, RLS, secrets, validation, dependencies |
| Report format | Executive summary + technical appendix (client handoff) |
| Standards basis | OWASP / general best practices — **not** agent-os standards |
| Product alignment | Pure technical audit — no product doc alignment required |
| Remediation | Fix **all** findings, prioritized Critical → High → Medium → Low |
| Methodology | Manual code review + automated dependency scan; no live exploitation |

## Audit Methodology

1. **Inventory** — Map auth boundaries, API routes, RLS policies, and secrets (see `references.md`).
2. **Review** — Walk each area against the OWASP checklist in `standards.md`.
3. **Document** — Record findings with severity, evidence, impact, and recommendation.
4. **Report** — Write executive summary and technical appendix in `report/`.
5. **Remediate** — Fix findings in code; update finding status in the appendix.
6. **Verify** — Re-review fixes, run tests, run `npm audit`, finalize report.

### Severity Scale

| Severity | Definition |
|----------|------------|
| Critical | Exploitable without special access; data breach or full account takeover likely |
| High | Exploitable with authenticated access or misconfiguration; significant data exposure |
| Medium | Requires chained conditions or limited impact; defense-in-depth gap |
| Low | Minor hardening opportunity; limited practical exploitability |
| Informational | Best-practice note; no direct exploit path |

## Context

- **Visuals:** Architecture and trust-boundary diagrams in [`visuals/README.md`](visuals/README.md)
- **References:** Full file inventory in [`references.md`](references.md)
- **Product alignment:** N/A — technical audit only

## Pre-Audit Observations

Initial codebase inventory (pre-Task 2) identified these **audit priorities**:

- Middleware refreshes cookies but does not enforce route-level auth
- `lib/auth-context.tsx` falls back to JWT metadata or mock users when `public.users` SELECT fails
- Client-side RBAC in layouts; APIs and RLS are the real enforcement layer
- Service-role writes in chat/demo routes trust route-level validation
- Cron auth inconsistent — two routes duplicate inline check instead of `authorizeCronRequest`
- n8n proxy forwards unvalidated JSON body to external webhook
- Demo role switcher in sidebar changes client state only (not session)
- Limited automated security tests (cron auth, demo HMAC tokens only)

These are hypotheses to confirm or refute during Tasks 2–6.

## Standards Applied

OWASP-oriented checklist — see [`standards.md`](standards.md).

Agent-os standards (`javascript/auth-rbac`, etc.) were explicitly excluded per shaping.
