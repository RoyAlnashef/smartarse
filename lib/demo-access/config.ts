import { SUPPORT_EMAIL } from "@/lib/support-contact"

export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  return url.replace(/\/$/, "")
}

export function getDemoApprovalSecret(): string | null {
  const secret = process.env.DEMO_APPROVAL_SECRET?.trim()
  return secret || null
}

export function getDemoApprovalTokenTtlHours(): number {
  const raw = process.env.DEMO_APPROVAL_TOKEN_TTL_HOURS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : 72
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 72
}

export function getDemoRequestTtlDays(): number {
  const raw = process.env.DEMO_REQUEST_TTL_DAYS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : 7
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7
}

/** Resend allows this sender without domain verification (see README demo email section). */
const RESEND_SANDBOX_FROM = "Disrupt Demo <onboarding@resend.dev>"

const DEFAULT_FROM_DISPLAY_NAME = "smartA.R.S.E."

export function isResendSandboxMode(): boolean {
  const flag = process.env.EMAIL_RESEND_SANDBOX?.trim().toLowerCase()
  return flag === "1" || flag === "true" || flag === "yes"
}

/** Extract bare email from `Name <addr>` or a plain address (case-insensitive). */
export function extractEmailAddress(fromHeader: string): string {
  const trimmed = fromHeader.trim()
  const angleMatch = trimmed.match(/<([^>]+)>/)
  const raw = angleMatch ? angleMatch[1] : trimmed
  return raw.trim().toLowerCase()
}

export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase()
}

export function isSameMailbox(a: string, b: string): boolean {
  return normalizeEmailAddress(a) === normalizeEmailAddress(b)
}

function getDefaultTransactionalFrom(): string {
  const domain = SUPPORT_EMAIL.split("@")[1]
  if (!domain) {
    return `${DEFAULT_FROM_DISPLAY_NAME} <noreply@disrupt-insight.com>`
  }
  return `${DEFAULT_FROM_DISPLAY_NAME} <noreply@${domain}>`
}

/** Reply-To for all demo transactional emails (support inbox). */
export function getTransactionalReplyToAddress(): string {
  return SUPPORT_EMAIL
}

/**
 * From header for demo emails. Avoids using the support inbox as From when it
 * would match the notification To (breaks many forward rules).
 */
export function getTransactionalFromAddress(): string {
  if (isResendSandboxMode()) {
    return RESEND_SANDBOX_FROM
  }

  const configured = process.env.EMAIL_FROM_ADDRESS?.trim()
  if (
    configured &&
    !isSameMailbox(extractEmailAddress(configured), SUPPORT_EMAIL)
  ) {
    return configured
  }

  return getDefaultTransactionalFrom()
}

/** @deprecated Prefer getTransactionalFromAddress — kept for existing call sites. */
export function getEmailFromAddress(): string | null {
  return getTransactionalFromAddress()
}

export function getEmailProviderApiKey(): string | null {
  return process.env.EMAIL_PROVIDER_API_KEY?.trim() || null
}

export function isDemoAccessEmailConfigured(): boolean {
  return Boolean(getTransactionalFromAddress() && getEmailProviderApiKey())
}
