# References — Client Settings + Credentials

## Existing settings/admin surface

### Admin settings page (current stub)
- **Location:** `[app/(dashboard)/settings/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/(dashboard)/settings/page.tsx)`
- **Relevance:** Current dashboard settings UI already contains a “Change Password” section stub; we will upgrade it to the full structure.

## Existing client shell + navigation

### Client layout (theme + auth redirect)
- **Location:** `[app/client/layout.tsx](/Users/royalnashef/Desktop/smart-arse/app/client/layout.tsx)`
- **Relevance:** Client-only shell; provides the client theme and redirects `admin` to `/dashboard`.

### Client projects route (existing pattern)
- **Location:** `[app/client/projects/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/client/projects/page.tsx)`
- **Relevance:** Client UI uses `arse-*` tokens and a custom typography system; settings should match this look.

### Client header chrome (Settings icon)
- **Location:** `[components/client/client-shell-header.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/client-shell-header.tsx)`
- **Relevance:** Settings button currently says “coming soon”; will link to `/client/settings`.

## Existing auth + mock data

### Auth context (role + client scoping)
- **Location:** `[lib/auth-context.tsx](/Users/royalnashef/Desktop/smart-arse/lib/auth-context.tsx)`
- **Relevance:** Provides `useAuth()` plus `getClientForUser()` used for client/org-scoped settings and credit summary.

### Mock seed + types
- **Location:** `[lib/mock-data.ts](/Users/royalnashef/Desktop/smart-arse/lib/mock-data.ts)`
- **Location:** `[lib/types.ts](/Users/royalnashef/Desktop/smart-arse/lib/types.ts)`
- **Relevance:** Source-of-truth shape for `User`, `Client`, and `Project` in mock mode.

## Visual reference

### Screenshot (provided via conversation)
- **Source path (in this repo environment):**
  `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-55678543-f527-461c-8aab-483122fff2bc.png`
- **How to use:** Copy into `agent-os/specs/2026-03-18-1516-client-settings-credentials/visuals/` as a future step if you want the asset physically stored alongside the spec.

