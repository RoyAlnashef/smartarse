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

export function isResendSandboxMode(): boolean {
  const flag = process.env.EMAIL_RESEND_SANDBOX?.trim().toLowerCase()
  return flag === "1" || flag === "true" || flag === "yes"
}

export function getEmailFromAddress(): string | null {
  if (isResendSandboxMode()) {
    return RESEND_SANDBOX_FROM
  }
  return process.env.EMAIL_FROM_ADDRESS?.trim() || null
}

export function getEmailProviderApiKey(): string | null {
  return process.env.EMAIL_PROVIDER_API_KEY?.trim() || null
}

export function isDemoAccessEmailConfigured(): boolean {
  return Boolean(getEmailFromAddress() && getEmailProviderApiKey())
}
