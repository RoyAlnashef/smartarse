"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  DEMO_COOKIE_BANNER_COPY,
  DEMO_SIGNUP_CONSENT_COPY,
  getDemoCookiePolicyHref,
  readDemoCookieConsent,
  writeDemoCookieConsent,
} from "@/lib/demo-access/consent"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function CookieInfoTerm({
  term,
  description,
}: {
  term: string
  description: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline font-medium text-arse-black underline decoration-arse-pink decoration-dotted underline-offset-2",
            "rounded-sm hover:text-arse-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/40"
          )}
        >
          {term}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-[min(16rem,calc(100vw-3rem))] border-arse-black/15 bg-white px-3 py-2 font-arse-body text-xs leading-snug text-arse-black shadow-md"
      >
        {description}
      </TooltipContent>
    </Tooltip>
  )
}

export function DemoFlowCookieBanner() {
  const [visible, setVisible] = useState(false)
  const cookiePolicyHref = getDemoCookiePolicyHref()

  useEffect(() => {
    const existing = readDemoCookieConsent()
    if (existing) {
      if (typeof window !== "undefined") {
        window.__SMARTARSE_DEMO_NON_ESSENTIAL_CONSENT__ = existing.nonEssential
      }
      setVisible(false)
      return
    }
    setVisible(true)
  }, [])

  function acceptOptional() {
    writeDemoCookieConsent(true)
    setVisible(false)
  }

  function rejectOptional() {
    writeDemoCookieConsent(false)
    setVisible(false)
  }

  if (!visible) return null

  const cookieButtonClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-arse-black px-3 py-2",
    "font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black sm:text-xs"
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="dialog"
        aria-labelledby="demo-cookie-banner-title"
        aria-describedby="demo-cookie-banner-desc"
        className={cn(
          "fixed bottom-4 left-4 z-50 grid w-[min(calc(100vw-2rem),20rem)] grid-cols-1 gap-3",
          "rounded-2xl border-2 border-arse-black/10 bg-arse-white/95 p-4 shadow-[6px_6px_0_0_var(--arse-cyan)] backdrop-blur-sm",
          "sm:bottom-6 sm:left-6 sm:w-auto sm:max-w-4xl sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4 sm:p-5"
        )}
      >
        <div className="min-w-0">
          <p
            id="demo-cookie-banner-title"
            className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-pink sm:text-xs"
          >
            {DEMO_COOKIE_BANNER_COPY.title}
          </p>
          <p
            id="demo-cookie-banner-desc"
            className="mt-1.5 text-xs leading-relaxed text-arse-black/85 sm:mt-2 sm:text-sm"
          >
            {DEMO_COOKIE_BANNER_COPY.introLead}
            <CookieInfoTerm
              term={DEMO_COOKIE_BANNER_COPY.essentialTerm}
              description={DEMO_COOKIE_BANNER_COPY.essentialDescription}
            />
            {DEMO_COOKIE_BANNER_COPY.introMiddle}
            <CookieInfoTerm
              term={DEMO_COOKIE_BANNER_COPY.optionalTerm}
              description={DEMO_COOKIE_BANNER_COPY.nonEssentialDescription}
            />
            {DEMO_COOKIE_BANNER_COPY.introTail}{" "}
            <Link
              href="/help/privacy"
              className="font-medium text-arse-black underline decoration-arse-pink underline-offset-2 hover:text-arse-pink"
            >
              {DEMO_SIGNUP_CONSENT_COPY.privacyLinkLabel}
            </Link>
            {cookiePolicyHref ? (
              <>
                {" "}
                ·{" "}
                <a
                  href={cookiePolicyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-arse-black underline decoration-arse-pink underline-offset-2 hover:text-arse-pink"
                >
                  {DEMO_SIGNUP_CONSENT_COPY.cookieLinkLabel}
                </a>
              </>
            ) : null}
          </p>
        </div>

        <button
          type="button"
          onClick={acceptOptional}
          className={cn(
            cookieButtonClass,
            "w-full bg-arse-pink shadow-[3px_3px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px sm:w-auto"
          )}
        >
          {DEMO_COOKIE_BANNER_COPY.acceptLabel}
        </button>
        <button
          type="button"
          onClick={rejectOptional}
          className={cn(
            cookieButtonClass,
            "w-full bg-white transition hover:bg-arse-black/5 sm:w-auto"
          )}
        >
          {DEMO_COOKIE_BANNER_COPY.rejectLabel}
        </button>
      </div>
    </TooltipProvider>
  )
}
