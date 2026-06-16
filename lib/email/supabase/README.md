# Supabase Auth email templates

Copy-paste HTML for **Authentication → Email Templates** in the Supabase dashboard.

## Before you paste

1. Set the sender display name to **smartA.R.S.E.** (not "Disrupt Insight").
2. Ensure redirect URLs are allowed (see root `README.md`).
3. Host `client-header-logo.gif` at your app domain — emails reference `{{ .SiteURL }}/client-header-logo.gif`.

## Link pattern

All templates use server-side `token_hash` verification via `/auth/confirm`:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=<path>
```

## Templates

| Dashboard template | Subject | Builder |
|-------------------|---------|---------|
| Reset password | Reset your smartA.R.S.E. password | `buildResetPasswordEmail()` |
| Confirm signup | Confirm your smartA.R.S.E. account | `buildConfirmSignupEmail()` |
| Magic link | Your smartA.R.S.E. sign-in link | `buildMagicLinkEmail()` |
| Invite user | You have been invited to smartA.R.S.E. | `buildInviteUserEmail()` |
| Change email | Confirm your new smartA.R.S.E. email | `buildChangeEmailEmail()` |

## Getting HTML

**Development:** open `/dev/emails`, select a Supabase template, click **Copy for Supabase**.

**Code:** import from `@/lib/email/supabase` and use `.html` from each builder.

## Reset password (required for this app)

The reset link must use `token_hash` (not `{{ .ConfirmationURL }}` alone):

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
```

This matches `components/auth-login-form.tsx` and `app/auth/confirm/route.ts`.
