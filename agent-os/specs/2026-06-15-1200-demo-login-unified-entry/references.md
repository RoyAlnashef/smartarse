# References for Unified Demo + Login Entry

## Similar Implementations

### Demo request page

- **Location:** `components/demo-request-page.tsx`, `app/demo/page.tsx`
- **Relevance:** Split layout, marketing panel, pink card, demo form, cookie banner
- **Key patterns:** `pillInputClass`, `submitButtonClass`, `DemoSignupConsentFields`, anti-enumeration success state

### Login page

- **Location:** `components/login-page.tsx`, `app/page.tsx`
- **Relevance:** Sign-in + forgot-password flows, Supabase auth integration
- **Key patterns:** `useAuth().login()`, `resetPasswordForEmail`, `postLoginPath(role)`

### Project sidebar tabs

- **Location:** `components/client/project-detail/project-sidebar-tabs.tsx`
- **Relevance:** Primary tab styling with magenta underline
- **Key patterns:** `TabsList variant="line"`, `tabTriggerClass` with `data-[state=active]:border-arse-pink`

### Demo signup v2 spec

- **Location:** `agent-os/specs/2026-06-03-1200-demo-signup-v2/`
- **Relevance:** Prior demo page design decisions and GDPR scope
