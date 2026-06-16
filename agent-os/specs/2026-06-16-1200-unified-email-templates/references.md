# References for Unified Email Templates

## Similar Implementations

### Shared email layout (current)

- **Location:** `lib/demo-access/templates/shared.ts`
- **Relevance:** Existing `renderEmailLayout`, `renderEmailButton`, color tokens, and `escapeHtml` — the baseline to extract into `lib/email/`
- **Key patterns:** Table-based card, inline CSS, pill CTAs (pink primary, white secondary), mint background `#e9faf9`, cyan shadow accent

### Demo access emails

- **Location:** `lib/demo-access/email.ts`
- **Relevance:** Three prospect/internal email types using `renderEmailLayout`
- **Key patterns:** `sendTransactionalEmail` wrapper; demo request with dual CTAs; magic link and rejection copy

### Support notification emails

- **Location:** `lib/support-notifications/templates.ts`
- **Relevance:** Low-credit and access-expiry alerts reuse layout but use plain `<a>` links instead of pill buttons
- **Key patterns:** `renderCreditBalanceLowEmail`, `renderAccessExpiresEmail`; project settings deep links

### Email transport

- **Location:** `lib/email/send-transactional.ts`, `lib/demo-access/config.ts`
- **Relevance:** Resend integration, From/Reply-To, sandbox mode — unchanged by this work
- **Key patterns:** `EMAIL_FROM_ADDRESS`, `noreply@` + `smart-arse@disrupt-insight.com` Reply-To

### Supabase auth confirm flow

- **Location:** `app/auth/confirm/route.ts`, `components/auth-login-form.tsx`
- **Relevance:** All Supabase email links must use `token_hash` verification via `/auth/confirm`
- **Key patterns:** `verifyOtp({ type, token_hash })`; reset uses `type=recovery&next=/auth/reset-password`

### Prior support-notifications spec

- **Location:** `agent-os/specs/2026-06-02-1200-disrupt-support-email-notifications/`
- **Relevance:** Established internal alert email types and Resend reuse pattern

### README email documentation

- **Location:** `README.md` (Sign In → Supabase email template section; Demo email sender; Support notifications)
- **Relevance:** Existing reset-password template override to extend for all auth templates

## Brand assets

- **Wordmark component:** `components/arse-logo-group.tsx` (text-based; not suitable for email)
- **Email logo (planned):** `public/client-header-logo.gif` — referenced in auth pages but not yet committed
- **Color tokens:** `app/globals.css` (`--arse-cyan`, `--arse-pink`); email palette in `shared.ts` uses slightly different hex values

## Email types inventory

| Type | Sender | Template location |
|------|--------|-------------------|
| Demo request notification | Resend | `lib/demo-access/email.ts` |
| Demo magic link | Resend | `lib/demo-access/email.ts` |
| Demo rejection | Resend | `lib/demo-access/email.ts` |
| Low project credits | Resend | `lib/support-notifications/templates.ts` |
| Access expires (28d / 14d) | Resend | `lib/support-notifications/templates.ts` |
| Reset password | Supabase | Dashboard (unbranded today) |
| Confirm signup | Supabase | Dashboard |
| Magic link | Supabase | Dashboard |
| Invite user | Supabase | Dashboard |
| Change email | Supabase | Dashboard |
