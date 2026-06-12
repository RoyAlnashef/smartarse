"use client"

import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DEMO_CONSENT_VERSIONS,
  DEMO_SIGNUP_CONSENT_COPY,
  getDemoCookiePolicyHref,
} from "@/lib/demo-access/consent"
import { cn } from "@/lib/utils"

export type DemoSignupConsentState = {
  privacyAccepted: boolean
  marketingAccepted: boolean
}

function PolicyLink({
  href,
  label,
  external,
}: {
  href: string
  label: string
  external?: boolean
}) {
  const className =
    "font-medium text-arse-black underline decoration-arse-pink underline-offset-2 hover:text-arse-pink"

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}

export function DemoSignupConsentFields({
  value,
  onChange,
  className,
}: {
  value: DemoSignupConsentState
  onChange: (next: DemoSignupConsentState) => void
  className?: string
}) {
  const cookiePolicyHref = getDemoCookiePolicyHref()
  const cookiePolicyExternal = cookiePolicyHref.startsWith("http")

  return (
    <fieldset className={cn("space-y-3 border-0 p-0", className)}>
      <legend className="sr-only">Consent</legend>

      <label className="flex cursor-pointer items-start gap-3 text-left">
        <Checkbox
          checked={value.privacyAccepted}
          onCheckedChange={(checked) =>
            onChange({
              ...value,
              privacyAccepted: checked === true,
            })
          }
          className="mt-0.5 border-arse-pink data-[state=checked]:bg-arse-pink data-[state=checked]:text-arse-black"
          aria-required
        />
        <span className="text-xs leading-relaxed text-arse-black/85">
          {DEMO_SIGNUP_CONSENT_COPY.privacyCheckbox}{" "}
          <PolicyLink href="/help/privacy" label={DEMO_SIGNUP_CONSENT_COPY.privacyLinkLabel} />
          ,{" "}
          <PolicyLink
            href={cookiePolicyHref}
            label={DEMO_SIGNUP_CONSENT_COPY.cookieLinkLabel}
            external={cookiePolicyExternal}
          />{" "}
          and{" "}
          <PolicyLink href="/help/terms" label={DEMO_SIGNUP_CONSENT_COPY.termsLinkLabel} />.
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-left">
        <Checkbox
          checked={value.marketingAccepted}
          onCheckedChange={(checked) =>
            onChange({
              ...value,
              marketingAccepted: checked === true,
            })
          }
          className="mt-0.5 border-arse-pink data-[state=checked]:bg-arse-pink data-[state=checked]:text-arse-black"
        />
        <span className="text-xs leading-relaxed text-arse-black/85">
          {DEMO_SIGNUP_CONSENT_COPY.marketingCheckbox}
        </span>
      </label>
    </fieldset>
  )
}

export function buildSignupConsentsRequestBody(state: DemoSignupConsentState) {
  return {
    privacyVersion: DEMO_CONSENT_VERSIONS.privacy,
    ...(state.marketingAccepted
      ? {
          marketingOptIn: true,
          marketingVersion: DEMO_CONSENT_VERSIONS.marketing,
        }
      : {}),
  }
}
