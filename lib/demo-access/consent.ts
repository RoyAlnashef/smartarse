/**
 * Demo-flow consent copy and version IDs (v2.0 — 12 June 2026).
 */

export const DEMO_CONSENT_VERSIONS = {
  privacy: "privacy-v2-2026-06-12",
  marketing: "marketing-v2-2026-06-12",
  cookie: "cookie-policy-v2-2026-06-12",
} as const

export const DEFAULT_COOKIE_POLICY_HREF = "/help/cookies"

export type DemoConsentVersionKey = keyof typeof DEMO_CONSENT_VERSIONS

export const DEMO_SIGNUP_CONSENT_COPY = {
  privacyCheckbox: "I agree to the",
  marketingCheckbox:
    "I would like to receive marketing communications about Disrupt Insight and smartA.R.S.E. (optional).",
  privacyLinkLabel: "Privacy policy",
  cookieLinkLabel: "Cookie policy",
  termsLinkLabel: "Terms and conditions",
} as const

export const DEMO_COOKIE_BANNER_COPY = {
  title: "Cookies",
  body: "We use essential cookies to run this demo. See our",
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

export function getDemoCookiePolicyHref(): string {
  const override = process.env.NEXT_PUBLIC_DEMO_COOKIE_POLICY_URL?.trim()
  return override || DEFAULT_COOKIE_POLICY_HREF
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

function parseDemoConsentRecord(value: unknown): DemoConsentRecord | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const acceptedAt =
    typeof record.acceptedAt === "string" ? record.acceptedAt.trim() : ""
  const version = typeof record.version === "string" ? record.version.trim() : ""
  if (!acceptedAt || !version) return null
  return { acceptedAt, version }
}

export function marketingConsentFromRequestMetadata(
  metadata: Record<string, unknown> | null | undefined
): {
  marketingOptIn: boolean
  marketingConsentAt: string | null
  marketingConsentVersion: string | null
} {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      marketingOptIn: false,
      marketingConsentAt: null,
      marketingConsentVersion: null,
    }
  }

  const consents = metadata.consents
  if (!consents || typeof consents !== "object" || Array.isArray(consents)) {
    return {
      marketingOptIn: false,
      marketingConsentAt: null,
      marketingConsentVersion: null,
    }
  }

  const marketing = parseDemoConsentRecord(
    (consents as Record<string, unknown>).marketing
  )
  if (!marketing) {
    return {
      marketingOptIn: false,
      marketingConsentAt: null,
      marketingConsentVersion: null,
    }
  }

  return {
    marketingOptIn: true,
    marketingConsentAt: marketing.acceptedAt,
    marketingConsentVersion: marketing.version,
  }
}
