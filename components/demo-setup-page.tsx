"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock } from "lucide-react"
import { ArseLogoGroup } from "@/components/arse-logo-group"
import { LoginFlowBackground } from "@/components/login-flow-background"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { establishSessionFromUrl } from "@/lib/supabase/session-from-url"
import { pillPasswordInputClass } from "@/lib/auth-form-styles"
import { cn } from "@/lib/utils"
import { LegalFooterNav } from "@/components/legal/legal-footer-nav"

type SetupPhase = "establishing" | "form" | "submitting" | "failed"

export function DemoSetupPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<SetupPhase>("establishing")
  const [establishError, setEstablishError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        if (!cancelled) {
          setEstablishError("Authentication is not configured.")
          setPhase("failed")
        }
        return
      }

      const result = await establishSessionFromUrl(supabase)
      if (cancelled) return

      if (!result.ok) {
        if (result.reason === "no_tokens") {
          setPhase("failed")
          return
        }
        setEstablishError(result.message ?? "Could not verify activation link.")
        setPhase("failed")
        return
      }

      setPhase("form")
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.")
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Authentication is not configured.")
      return
    }

    setPhase("submitting")

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setPhase("form")
      setError("Could not set password. Please try again.")
      return
    }

    try {
      const completeRes = await fetch("/api/demo/complete-password-setup", {
        method: "POST",
      })
      if (!completeRes.ok) {
        setPhase("form")
        setError("Could not finish account setup. Please try again.")
        return
      }

      let redirectPath = "/client/projects"
      const loginRes = await fetch("/api/demo/record-first-login", {
        method: "POST",
      })
      if (loginRes.ok) {
        const data = (await loginRes.json()) as { redirectPath?: string | null }
        if (data.redirectPath) redirectPath = data.redirectPath
      }

      router.replace(redirectPath)
    } catch {
      setPhase("form")
      setError("Could not finish account setup. Please try again.")
    }
  }

  if (phase === "establishing" || phase === "submitting") {
    return (
      <div className="arse-surface-bg relative flex min-h-screen flex-col font-arse-body text-arse-black">
        <LoginFlowBackground />
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
        </div>
      </div>
    )
  }

  if (phase === "failed") {
    return (
      <div className="arse-surface-bg relative flex min-h-screen flex-col font-arse-body text-arse-black">
        <LoginFlowBackground />
        <main className="relative z-10 flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-arse-black/10 bg-white p-6 text-center shadow-[6px_6px_0_0_var(--arse-cyan)]">
            <p className="font-arse-title text-lg font-semibold text-arse-black">
              Invalid or expired link
            </p>
            <p className="mt-2 text-sm text-arse-black/70">
              {establishError ??
                "Request demo access or sign in with your email and password."}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex rounded-full border-2 border-arse-black bg-arse-pink px-4 py-2 text-xs font-bold uppercase tracking-wide text-arse-black"
              >
                Request demo
              </Link>
              <Link
                href="/?tab=login"
                className="inline-flex rounded-full border-2 border-arse-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-arse-black"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="arse-surface-bg relative flex min-h-screen flex-col font-arse-body text-arse-black">
      <LoginFlowBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-md flex-col items-center gap-10 text-center">
          <img
            src="/client-header-logo.gif"
            alt="disrupt"
            className="mx-auto block h-[64px] w-auto"
            draggable={false}
          />
          <ArseLogoGroup className="flex w-max max-w-full flex-col items-stretch gap-0" />

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-4 rounded-2xl border-2 border-arse-black/10 bg-arse-white/85 p-6 text-left shadow-[6px_6px_0_0_var(--arse-cyan)] backdrop-blur-sm sm:p-8"
          >
            <p className="font-arse-title text-center text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
              Activate demo access
            </p>
            <p className="text-center text-xs text-arse-black/70">
              Create a password for your account. You will use it to sign in next time.
            </p>

            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
              <div className="relative min-w-0 flex-1">
                <input
                  id="demo-setup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className={pillPasswordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-arse-pink outline-none transition hover:bg-arse-black/5"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
              <div className="relative min-w-0 flex-1">
                <input
                  id="demo-setup-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={pillPasswordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-arse-pink outline-none transition hover:bg-arse-black/5"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="text-center text-sm text-red-700">{error}</p>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-full border-2 border-arse-black bg-arse-pink px-4 py-3.5 text-arse-black",
                  "font-arse-title text-xs font-bold uppercase tracking-wide",
                  "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]"
                )}
              >
                Create password &amp; continue
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex flex-col items-center justify-between gap-3 px-4 py-6 font-arse-body text-[10px] font-medium uppercase tracking-wider text-arse-black sm:flex-row sm:px-8 sm:text-xs">
        <LegalFooterNav />
        <p className="text-arse-black/70">© Disrupt Insight {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
