# Demo Signup v2 — Shaping Notes

## Scope

Refresh the public demo signup and onboarding experience:

- **Split layout** on `/demo` — marketing panel + expanded signup form
- **Four signup fields** — first name, last name, business email, organization name
- **Password setup after approval** — replace passwordless magic-link entry with `/auth/demo-setup`
- **UK GDPR plumbing (demo-scoped)** — consent checkboxes and cookie banner on demo routes only; client supplies final legal text

Builds on the existing demo access lifecycle in [`agent-os/specs/2026-05-19-1200-demo-access-flow/`](../2026-05-19-1200-demo-access-flow/).

## Decisions

| Topic               | Decision                                                                                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout              | Match wireframe **structure** (50/50 split: marketing left, form card right); apply existing **smart A.R.S.E.** tokens (`arse-pink`, `arse-cyan`, `font-arse-*`, pill inputs, `LoginFlowBackground`) — not Savanta colors |
| Left panel copy     | **Client-provided** (see below)                                                                                                                                                                                                                                   |
| Feature icons       | Client vector assets exist; **placeholder icons** in v1 implementation                                                                                                                                                                                            |
| GDPR legal text     | **Client/legal team** supplies final wording; engineering delivers UI slots + persistence                                                                                                                                                                                     |
| Cookie banner scope | **`/demo` flow only** for now (`/demo`, `/auth/demo-setup`)                                                                                                                                                                                                     |
| Admin UI            | Show name + organization only; consent stored in `metadata`, not surfaced in admin table                                                                                                                                                                          |
| DB fields           | Prefer dedicated columns on `demo_access_requests` for name/org (admin sort/filter)                                                                                                                                                                               |

## Left panel content (approved)

**Intro paragraph:**

> SmartA.R.S.E. is your data detective. A stop shop for all the insights on your Disrupt research project. Login to our secure platform and your our smart chatbot to dive into the research: Pull out key stats, generate summaries, compare subgroups, identify themes, build tables and create and talk to persona's grounded in the project data. smartA.R.S.E. is not regurgitating stats we've built an analysis heuristic grounded in our favourite BeSci and behavioural‑change frameworks, meaning all responses are shaped through the lens of the bespoke reports Disrupt creates as part of your project. Headings, summaries and recommendations all feed directly into what the responses you get, giving you smart, context‑rich insight every time.

**Feature bullets (7):**

1. Integrates **any research inputs** from multiple research phases
2. **Talk to persona** feature; interrogate the whole project or specific audiences
3. **No hallucinations** — responses locked to project topics
4. **100% accuracy**
5. **Secure & private platform**
6. Clear **citations** to data sources
7. **Easy & intuitive** for any stakeholders

_(Minor typos e.g. "your our" can be corrected with client during copy QA.)_

## GDPR / cookie scope

- **Signup:** required processing consent + optional marketing slot; links to `/help/privacy` and client cookie policy URL when provided
- **Cookie banner:** `/demo` and `/auth/demo-setup` only — essential vs non-essential; block non-essential until consent (likely Supabase session only on these pages today)
- **Persistence:** `demo_access_requests.metadata.consents` on submit; cookie preferences in `localStorage` (+ optional versioned cookie record)
- **Go-live blocker:** client legal must deliver final strings and consent version IDs

## Context

- **Visuals:** Current `/demo` screenshot + wireframe layout reference — see [`visuals/README.md`](visuals/README.md)
- **References:** [`references.md`](references.md)
- **Legal briefing (parallel):** [`client-legal-briefing.md`](client-legal-briefing.md) when present — factual inventory for counsel

## Standards applied

- `css/ui-styling`
- `global/app-routing-protected-shell`
- `global/project-conventions`
- `javascript/auth-rbac`
- `global/developer-guide`

See [`standards.md`](standards.md).
