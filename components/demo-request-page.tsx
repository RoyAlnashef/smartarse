"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Mail, User } from "lucide-react"
import { ArseLogoGroup } from "@/components/arse-logo-group"
import { DemoFlowCookieBanner } from "@/components/demo-flow-cookie-banner"
import {
  DemoSignupConsentFields,
  buildSignupConsentsRequestBody,
  type DemoSignupConsentState,
} from "@/components/demo-signup-consent-fields"
import { LoginFlowBackground } from "@/components/login-flow-background"
import { readDemoCookieConsent } from "@/lib/demo-access/consent"
import { DEMO_FEATURES, DEMO_INTRO_PARAGRAPH } from "@/lib/demo-access/demo-marketing"
import { cn } from "@/lib/utils"

const pillInputClass = cn(
  "min-h-12 w-full rounded-full border-2 border-arse-pink bg-arse-white/90 px-5 py-3 text-sm text-arse-black",
  "placeholder:text-arse-black/40",
  "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
)

const submitButtonClass = cn(
  "inline-flex w-full items-center justify-center rounded-full border-2 border-arse-black bg-arse-pink px-4 py-3.5 text-arse-black",
  "font-arse-title text-xs font-bold uppercase tracking-wide",
  "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]",
  "disabled:cursor-not-allowed disabled:opacity-60"
)

/** Matches `ClientShellHeader` disrupt wordmark sizing. */
const DISRUPT_LOGO_CLASS = "mr-auto block h-[64px] w-auto sm:h-[64px]"

function MarketingPanel() {
  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col lg:min-h-full">
      <img
        src="/client-header-logo.gif"
        alt="disrupt"
        className={DISRUPT_LOGO_CLASS}
        draggable={false}
      />

      <div className="mt-8 flex flex-col gap-6 lg:my-auto lg:gap-8">
        <ArseLogoGroup className="flex w-max max-w-full flex-col items-stretch gap-0" />

        <p className="text-sm leading-relaxed text-arse-black/85 sm:text-[15px]">
          {DEMO_INTRO_PARAGRAPH}
        </p>

        <ul className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {DEMO_FEATURES.map((feature) => (
          <li key={feature.iconSrc} className="flex items-center gap-3 text-sm text-arse-black/90">
            <img
              src={feature.iconSrc}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0"
              draggable={false}
            />
            <span className="leading-snug">
              {feature.prefix}
              <strong className="font-semibold text-arse-black">{feature.emphasis}</strong>
              {feature.suffix}
            </span>
          </li>
        ))}
        </ul>
      </div>
    </div>
  )
}

export function DemoRequestPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [consents, setConsents] = useState<DemoSignupConsentState>({
    privacyAccepted: false,
    marketingAccepted: false,
  })

  const canSubmit = consents.privacyAccepted && !isSubmitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consents.privacyAccepted) return
    setIsSubmitting(true)
    try {
      const cookiePreferences = readDemoCookieConsent()
      await fetch("/api/demo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          organizationName: organizationName.trim(),
          consents: buildSignupConsentsRequestBody(consents),
          ...(cookiePreferences ? { cookiePreferences } : {}),
        }),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="arse-surface-bg relative min-h-screen font-arse-body text-arse-black">
      <LoginFlowBackground />

      <main className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        <section
          className={cn(
            "hidden w-full flex-col backdrop-blur-sm",
            "bg-arse-white/40 lg:flex lg:min-h-screen lg:w-1/2 lg:px-12 lg:py-14 xl:px-16 xl:py-16"
          )}
        >
          <MarketingPanel />
        </section>

        <section
          className={cn(
            "flex min-h-screen w-full flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10",
            "lg:min-h-screen lg:w-1/2 lg:px-12 lg:py-14 xl:px-16"
          )}
        >
          <div className="flex w-full max-w-md flex-col items-center gap-8 sm:gap-10">
            <ArseLogoGroup className="flex w-max max-w-full flex-col items-center gap-0 lg:hidden" />

            <div
              className={cn(
                "w-full overflow-hidden rounded-3xl border-4 border-arse-pink bg-zinc-50 p-6 sm:p-8"
              )}
            >
              {submitted ? (
                <div className="space-y-3 text-center">
                  <p className="font-arse-title text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
                    Request received
                  </p>
                  <p className="text-sm text-arse-black/80">
                    We&apos;ll be in touch via email if you&apos;re approved. Please make sure to check your spam folder.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-block font-arse-title text-xs font-semibold uppercase tracking-[0.2em] text-arse-black/75 underline decoration-arse-pink decoration-2 underline-offset-4 hover:text-arse-pink"
                  >
                    Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <p className="font-arse-title text-center text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
                    Request demo access
                  </p>
                  <p className="text-center text-xs text-arse-black/70">
                    Our team will review your request for demo access and get back to you as soon as possible.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2 sm:col-span-1">
                      <User
                        className="h-5 w-5 shrink-0 text-arse-pink"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <input
                        id="demo-first-name"
                        type="text"
                        autoComplete="given-name"
                        required
                        maxLength={80}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className={pillInputClass}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <input
                        id="demo-last-name"
                        type="text"
                        autoComplete="family-name"
                        required
                        maxLength={80}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className={pillInputClass}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail
                      className="h-5 w-5 shrink-0 text-arse-pink"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <input
                      id="demo-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Business email address"
                      className={pillInputClass}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2
                      className="h-5 w-5 shrink-0 text-arse-pink"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <input
                      id="demo-organization"
                      type="text"
                      autoComplete="organization"
                      required
                      maxLength={160}
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Organization name"
                      className={pillInputClass}
                    />
                  </div>

                  <DemoSignupConsentFields value={consents} onChange={setConsents} />

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={submitButtonClass}
                    >
                      {isSubmitting ? "Submitting…" : "Request access"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <DemoFlowCookieBanner />
    </div>
  )
}
