/**
 * Demo-flow consent copy and version IDs.
 * Replace strings when legal delivers final wording (see client-legal-briefing.md §9).
 */

export const DEMO_CONSENT_VERSIONS = {
  privacy: "privacy-demo-2026-06-04",
  marketing: "marketing-demo-2026-06-04",
  cookie: "cookie-policy-2026-06-04",
} as const

export type DemoConsentVersionKey = keyof typeof DEMO_CONSENT_VERSIONS

/** Engineering placeholder copy — legal may replace before production go-live. */
export const DEMO_SIGNUP_CONSENT_COPY = {
  privacyCheckbox:
    "I agree that Disrupt Insight may process my personal data to review and respond to my demo access request.",
  marketingCheckbox:
    "I would like to receive marketing communications about Disrupt Insight and smartA.R.S.E. (optional).",
  privacyLinkLabel: "Privacy policy",
  cookieLinkLabel: "Cookie policy",
} as const

export const DEMO_COOKIE_BANNER_COPY = {
  title: "Cookies on this demo experience",
  introLead: "We use ",
  essentialTerm: "essential cookies",
  introMiddle:
    " so you can sign in and submit a demo request. You can choose whether to allow ",
  optionalTerm: "optional cookies",
  introTail: " used for analytics and similar features.",
  essentialDescription:
    "Required for authentication and security (for example Supabase session cookies). These always stay on for this page to work.",
  nonEssentialDescription:
    "Analytics or similar tools that are not required for the demo signup flow. We do not load optional tools on this page until you accept.",
  acceptLabel: "Accept optional cookies",
  rejectLabel: "Essential only",
} as const

const COOKIE_STORAGE_KEY = "smartarse-demo-cookie-consent"

export type DemoCookiePreferences = {
  essential: true
  nonEssential: boolean
  recordedAt: string
  version: string
}

export type DemoConsentRecord = {
  acceptedAt: string
  version: string
}

export type DemoSignupConsentsMetadata = {
  consents: {
    privacy: DemoConsentRecord
    marketing?: DemoConsentRecord
  }
  cookiePreferences?: DemoCookiePreferences
}

export type DemoSignupConsentsPayload = {
  privacyVersion: string
  marketingOptIn?: boolean
  marketingVersion?: string
}

declare global {
  interface Window {
    __SMARTARSE_DEMO_NON_ESSENTIAL_CONSENT__?: boolean
  }
}

export function isDemoNonEssentialScriptsAllowed(): boolean {
  if (typeof window === "undefined") return false
  return window.__SMARTARSE_DEMO_NON_ESSENTIAL_CONSENT__ === true
}

export function readDemoCookieConsent(): DemoCookiePreferences | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoCookiePreferences
    if (parsed.version !== DEMO_CONSENT_VERSIONS.cookie) return null
    if (parsed.essential !== true) return null
    return parsed
  } catch {
    return null
  }
}

export function writeDemoCookieConsent(nonEssential: boolean): DemoCookiePreferences {
  const prefs: DemoCookiePreferences = {
    essential: true,
    nonEssential,
    recordedAt: new Date().toISOString(),
    version: DEMO_CONSENT_VERSIONS.cookie,
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(prefs))
    window.__SMARTARSE_DEMO_NON_ESSENTIAL_CONSENT__ = nonEssential
  }
  return prefs
}

export function getDemoCookiePolicyHref(): string | null {
  const url = process.env.NEXT_PUBLIC_DEMO_COOKIE_POLICY_URL?.trim()
  return url || null
}

export function isValidPrivacyConsentVersion(version: string): boolean {
  return version === DEMO_CONSENT_VERSIONS.privacy
}

export function isValidMarketingConsentVersion(version: string): boolean {
  return version === DEMO_CONSENT_VERSIONS.marketing
}

export function parseDemoCookiePreferencesPayload(
  input: unknown
): DemoCookiePreferences | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  if (record.version !== DEMO_CONSENT_VERSIONS.cookie) return null
  if (record.essential !== true) return null
  if (typeof record.nonEssential !== "boolean") return null
  if (typeof record.recordedAt !== "string" || !record.recordedAt.trim()) {
    return null
  }
  return {
    essential: true,
    nonEssential: record.nonEssential,
    recordedAt: record.recordedAt,
    version: DEMO_CONSENT_VERSIONS.cookie,
  }
}

export function parseSignupConsentsPayload(
  input: unknown
): DemoSignupConsentsPayload | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  const privacyVersion =
    typeof record.privacyVersion === "string" ? record.privacyVersion : null
  if (!privacyVersion || !isValidPrivacyConsentVersion(privacyVersion)) {
    return null
  }

  const marketingOptIn = record.marketingOptIn === true
  const marketingVersion =
    typeof record.marketingVersion === "string" ? record.marketingVersion : undefined

  if (marketingOptIn) {
    if (!marketingVersion || !isValidMarketingConsentVersion(marketingVersion)) {
      return null
    }
  }

  return {
    privacyVersion,
    marketingOptIn: marketingOptIn || undefined,
    marketingVersion: marketingOptIn ? marketingVersion : undefined,
  }
}

export function buildSignupConsentsMetadata(
  payload: DemoSignupConsentsPayload,
  cookiePreferences?: DemoCookiePreferences | null
): DemoSignupConsentsMetadata {
  const now = new Date().toISOString()
  const metadata: DemoSignupConsentsMetadata = {
    consents: {
      privacy: {
        acceptedAt: now,
        version: payload.privacyVersion,
      },
    },
  }

  if (payload.marketingOptIn && payload.marketingVersion) {
    metadata.consents.marketing = {
      acceptedAt: now,
      version: payload.marketingVersion,
    }
  }

  if (cookiePreferences) {
    metadata.cookiePreferences = cookiePreferences
  }

  return metadata
}

export function mergeDemoRequestMetadata(
  existing: Record<string, unknown> | null | undefined,
  signupMetadata: DemoSignupConsentsMetadata,
  requestContext: Record<string, unknown>
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...existing }
      : {}

  return {
    ...base,
    ...requestContext,
    consents: signupMetadata.consents,
    cookiePreferences:
      signupMetadata.cookiePreferences ?? base.cookiePreferences,
  }
}
