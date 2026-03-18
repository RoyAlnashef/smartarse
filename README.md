# smartA.R.S.E.

A **project-centric workspace** for research and insights teams: organize client projects, upload research documents, and chat with selected documents (RAG-style UX)—with role-based access, credit budgets, and auditable context.

**Implementation note:** The app currently uses **mock data** and **simulated AI** while UI and flows are built. The MVP target is **Supabase** (auth, projects, storage) plus **Disrupt’s AI/RAG API** for real chat.

## Tech stack

- **Next.js** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS** · Radix UI · **shadcn-style** patterns (CVA, lucide-react)
- **pnpm** for dependencies

See [`agent-os/product/tech-stack.md`](agent-os/product/tech-stack.md) for the full list.

## Getting started

**Requirements:** Node.js (LTS recommended), [pnpm](https://pnpm.io/installation).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command   | Description              |
| --------- | ------------------------ |
| `pnpm dev`   | Dev server (Turbopack)   |
| `pnpm build` | Production build         |
| `pnpm start` | Run production server    |
| `pnpm lint`  | ESLint (Next.js)         |

## Project layout

| Path | Purpose |
| ---- | ------- |
| `app/` | Next.js App Router pages and layouts |
| `lib/` | Shared code (e.g. mock data, auth context) |
| `agent-os/product/` | Mission, roadmap, tech stack |
| `agent-os/standards/` | Engineering standards (`index.yml`) |

## Product docs

- [Mission & problem](agent-os/product/mission.md)
- [Roadmap](agent-os/product/roadmap.md)
- [Tech stack](agent-os/product/tech-stack.md)

## License

Private / not published—see repository settings.
