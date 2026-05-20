"use client"

import { useState } from "react"
import Link from "next/link"
import { User } from "lucide-react"
import { ArseLogoGroup } from "@/components/arse-logo-group"
import { LoginFlowBackground } from "@/components/login-flow-background"
import { cn } from "@/lib/utils"
import { SUPPORT_CONTACT_NEW_TAB_HREF } from "@/lib/support-contact"

export function DemoRequestPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await fetch("/api/demo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="arse-surface-bg relative flex min-h-screen flex-col font-arse-body text-arse-black">
      <LoginFlowBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-md flex-col items-center justify-start gap-12 text-center">
          <img
            src="/client-header-logo.gif"
            alt="disrupt"
            className="mx-auto block h-[64px] w-auto"
            draggable={false}
          />

          <ArseLogoGroup className="flex w-max max-w-full flex-col items-stretch gap-0" />

          {submitted ? (
            <div className="w-64 space-y-3 sm:w-72">
              <p className="font-arse-title text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
                Request received
              </p>
              <p className="text-sm text-arse-black/80">
                We&apos;ll be in touch if approved.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block font-arse-title text-xs font-semibold uppercase tracking-[0.2em] text-arse-black/75 underline decoration-arse-pink decoration-2 underline-offset-4 hover:text-arse-pink"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-64 space-y-4 text-left sm:w-72"
            >
              <p className="font-arse-title mb-2 text-center text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
                Request demo access
              </p>
              <p className="text-center text-xs text-arse-black/70">
                Enter your work email. Our team will review your request.
              </p>
              <div className="flex items-center gap-3">
                <User
                  className="h-6 w-6 shrink-0 text-arse-pink"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  id="demo-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className={cn(
                    "min-h-12 flex-1 rounded-full border-2 border-arse-pink bg-arse-white/90 px-5 py-3 text-sm text-arse-black",
                    "placeholder:text-arse-black/40",
                    "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
                  )}
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "inline-flex w-full items-center justify-center rounded-full border-2 border-arse-black bg-arse-pink px-4 py-3.5 text-arse-black",
                    "font-arse-title text-xs font-bold uppercase tracking-wide",
                    "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  {isSubmitting ? "Submitting…" : "Request access"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-[10px] font-medium uppercase tracking-wider text-arse-black sm:flex-row sm:px-8 sm:text-xs">
        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="text-arse-black/40">|</span>
          <Link href="/help/faq" className="hover:text-arse-pink">
            FAQ
          </Link>
          <span className="text-arse-black/40">|</span>
          <Link href="/help/privacy" className="hover:text-arse-pink">
            Privacy policy
          </Link>
          <span className="text-arse-black/40">|</span>
          <a
            href={SUPPORT_CONTACT_NEW_TAB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-arse-pink"
          >
            Contact the team
          </a>
        </nav>
        <p className="text-arse-black/70">© Disrupt Insight {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
