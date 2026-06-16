"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock } from "lucide-react"
import { ArseLogoGroup } from "@/components/arse-logo-group"
import { postLoginPath } from "@/components/auth-login-form"
import { LoginFlowBackground } from "@/components/login-flow-background"
import { useAuth } from "@/lib/auth-context"
import { pillPasswordInputClass, submitButtonClass } from "@/lib/auth-form-styles"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type ResetPhase = "establishing" | "form" | "submitting" | "failed"

export function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const [phase, setPhase] = useState<ResetPhase>("establishing")
  const [establishError, setEstablishError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const authError = searchParams.get("error")
    if (authError === "invalid_link") {
      setEstablishError("Request a new password reset email from sign in.")
      setPhase("failed")
      return
    }

    const code = searchParams.get("code")
    const tokenHash = searchParams.get("token_hash")
    if (code || tokenHash) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("next", "/auth/reset-password")
      router.replace(`/auth/confirm?${params.toString()}`)
      return
    }
  }, [router, searchParams])

  useEffect(() => {
    if (phase === "failed") return

    if (searchParams.get("error") === "invalid_link") return

    if (isLoading) return

    if (user) {
      setPhase((current) => (current === "submitting" ? current : "form"))
      return
    }

    if (searchParams.get("code") || searchParams.get("token_hash")) return

    setEstablishError(
      (current) =>
        current ?? "Request a new password reset email from sign in.",
    )
    setPhase("failed")
  }, [isLoading, user, phase, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("New password and confirmation do not match.")
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Authentication is not configured.")
      return
    }
    if (!user) {
      setError("Your session expired. Request a new reset link.")
      return
    }

    setPhase("submitting")

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setPhase("form")
      setError("Could not update password. Please try again.")
      return
    }

    router.replace(postLoginPath(user.role))
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
              Invalid or expired reset link
            </p>
            <p className="mt-2 text-sm text-arse-black/70">
              {establishError ??
                "Request a new password reset email from sign in."}
            </p>
            <Link
              href="/?tab=login"
              className="mt-5 inline-flex rounded-full border-2 border-arse-black bg-arse-pink px-4 py-2 text-xs font-bold uppercase tracking-wide text-arse-black"
            >
              Back to sign in
            </Link>
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

          <div
            className={cn(
              "w-full overflow-hidden rounded-3xl border-4 border-arse-pink bg-zinc-50 p-6 sm:p-8",
            )}
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <p className="font-arse-title text-center text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
                Reset Password
              </p>
              <p className="text-center text-xs text-arse-black/70">
                Choose a new password for your account.
              </p>

              <div className="flex items-center gap-2">
                <Lock
                  className="h-5 w-5 shrink-0 text-arse-pink"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <div className="relative min-w-0 flex-1">
                  <input
                    id="reset-password-new"
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
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-arse-pink outline-none transition hover:bg-arse-black/5 focus-visible:ring-2 focus-visible:ring-arse-black/25"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Lock
                  className="h-5 w-5 shrink-0 text-arse-pink"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <div className="relative min-w-0 flex-1">
                  <input
                    id="reset-password-confirm"
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
                    aria-label={
                      showConfirm ? "Hide confirmation" : "Show confirmation"
                    }
                    aria-pressed={showConfirm}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-arse-pink outline-none transition hover:bg-arse-black/5 focus-visible:ring-2 focus-visible:ring-arse-black/25"
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
                <button type="submit" className={submitButtonClass}>
                  Save password
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
