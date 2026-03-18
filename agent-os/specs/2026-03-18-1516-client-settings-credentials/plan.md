# Client Settings + Credentials (Client & Admin) — Plan

## Goal
Implement a dedicated client-user settings experience where `client`/`user` roles can manage their credentials (mocked change password + profile info) and configure standard SaaS settings (notifications, privacy/data export, and billing/usage info placeholders).

## Key routes
- Client: `app/client/settings/page.tsx` (mounted under `app/client/layout.tsx` for the client theme).
- Admin/dashboard: keep `app/(dashboard)/settings/page.tsx` as the admin settings surface.
- Client header settings icon should navigate to `/client/settings`.

## Non-goals (this iteration)
- Real backend/API integration (Supabase) for password/profile updates.
- Credit decrement / AI streaming auth.
- Full billing/checkout integration.

## Architecture (routing)
```mermaid
flowchart LR
  Root[app/page.tsx]
  subgraph AdminShell[Admin shell]
    AdminLayout[app/(dashboard)/layout.tsx]
    AdminSettings[app/(dashboard)/settings/page.tsx]
  end
  subgraph ClientShell[Client shell]
    ClientLayout[app/client/layout.tsx]
    ClientSettings[app/client/settings/page.tsx]
  end

  Root -->|admin| AdminLayout
  Root -->|client/user| ClientLayout
  ClientLayout -->|Settings button| ClientSettings
```

## Task 1: Save Spec Documentation
Create this spec folder and its docs (`plan.md`, `shape.md`, `standards.md`, `references.md`, `visuals/`).

## Task 2: Add shared settings UI building blocks
Create reusable, theme-agnostic settings components (forms/sections) under `components/settings/`:
- `ChangePasswordForm`
- `NotificationsSection`
- `BillingUsageSection` (read-only mock summary + placeholders)
- `PrivacyDataExportSection` (links + mock export action)

## Task 3: Implement client settings page
Create `app/client/settings/page.tsx` that renders:
- Profile info (name/email) + “Change password” form.
- Notifications toggles.
- Usage/Credits summary (from `useAuth().getClientForUser()` via existing mock data).
- Billing plan placeholders.
- Privacy links + “Export my data” mock action.

Mock persistence rules:
- “Save” actions update local UI state immediately.
- Persist preferences to `sessionStorage` for the current session only.
- Password save is simulated (validation + success message only).

## Task 4: Wire client header to new settings route
Update `components/client/client-shell-header.tsx` so Settings navigates to `/client/settings` instead of “coming soon”.

## Task 5: Upgrade admin settings page to match structure
Update `app/(dashboard)/settings/page.tsx` to mirror the same sections and mock save behavior for `admin` users.

## Task 6: Add session storage helpers (mock)
Add a helper under `lib/` (or local to the settings feature) to read/write settings/preferences in `sessionStorage` keyed by user id.

## Task 7: Quick local QA checklist
- Verify `admin` lands on dashboard settings and `client/user` lands on `/client/settings`.
- Confirm settings icon navigates to the new page.
- Confirm change password form validates (new/confirm match) and shows success (mock).
- Confirm notification toggles persist across navigation within the session.
- Confirm export action triggers a mock “download/export” and privacy links route to existing pages.

