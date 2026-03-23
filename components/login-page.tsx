"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/types"

function postLoginPath(role: UserRole) {
  return role === "admin" ? "/dashboard" : "/client/projects"
}

type LoginFormMode = "signin" | "forgot"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [resetStatus, setResetStatus] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [mode, setMode] = useState<LoginFormMode>("signin")
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setResetStatus(null)
    const user = await login(email, password)
    if (user) {
      router.replace(postLoginPath(user.role))
    } else {
      setError("Sign in failed. Check your credentials and try again.")
    }
  }

  async function handleForgotPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setResetStatus(null)
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Enter your email to get a reset link.")
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase || typeof window === "undefined") {
      setError("Password reset is unavailable right now. Please try again shortly.")
      return
    }

    setIsResetting(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setIsResetting(false)

    if (resetError) {
      setError("Could not send reset email. Please try again.")
      return
    }

    setResetStatus("Password reset email sent. Check your inbox for the link.")
  }

  function showForgotMode() {
    setMode("forgot")
    setError("")
    setResetStatus(null)
  }

  function showSignInMode() {
    setMode("signin")
    setError("")
    setResetStatus(null)
  }

  return (
    <div className="arse-surface-bg relative flex min-h-screen flex-col font-arse-body text-arse-black">
      {/* Decorative waves (wireframe — swap for final art) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden
        style={{
          backgroundImage: `repeating-linear-gradient(
            -12deg,
            transparent,
            transparent 40px,
            rgba(0,0,0,0.08) 40px,
            rgba(0,0,0,0.08) 41px
          )`,
        }}
      />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-md flex-col items-center justify-start text-center">
          {/* disrupt wordmark */}
          <img
            src="/disrupt-logo-blktxt.png"
            alt="disrupt"
            className="mx-auto block h-[26px] w-auto sm:h-[30px]"
            draggable={false}
          />

          <h1 className="mt-6 flex flex-wrap items-end justify-center gap-x-1 gap-y-0 text-4xl sm:text-5xl md:text-6xl">
            <span className="font-arse-smart text-arse-pink leading-none">smart</span>
            <span className="font-arse-title font-bold tracking-[0.12em] text-arse-black">A.R.S.E</span>
          </h1>
          <p className="font-arse-title mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-arse-black sm:text-sm">
            Agentic research search engine
          </p>

          <p className="font-arse-title mt-10 text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
            {mode === "signin" ? "Login" : "Reset Password"}
          </p>

          {mode === "signin" ? (
            <form onSubmit={handleSignInSubmit} className="mt-6 w-80 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or username"
                  className={cn(
                    "min-h-12 flex-1 rounded-full border-2 border-arse-pink bg-arse-white/90 px-5 py-3 text-sm text-arse-black",
                    "placeholder:text-arse-black/40",
                    "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
                  )}
                />
              </div>
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
                <div className="relative min-w-0 flex-1">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={cn(
                      "min-h-12 w-full rounded-full border-2 border-arse-pink bg-arse-white/90 py-3 pl-5 pr-12 text-sm text-arse-black",
                      "placeholder:text-arse-black/40",
                      "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
                    )}
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

              {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}
              {resetStatus ? <p className="text-center text-sm text-emerald-700">{resetStatus}</p> : null}

              <div className="pt-2">
                <button
                  type="submit"
                  className={cn(
                    "inline-flex w-full items-center justify-center rounded-full border-2 border-arse-black bg-arse-pink px-4 py-3.5 text-arse-black",
                    "font-arse-title text-xs font-bold uppercase tracking-wide",
                    "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]"
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={showForgotMode}
                  className="mt-3 w-full text-center font-arse-title text-xs font-semibold uppercase tracking-[0.2em] text-arse-black/75 underline decoration-arse-pink decoration-2 underline-offset-4 hover:text-arse-pink"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="mt-6 w-80 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
                <input
                  id="reset-email"
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
              <p className="text-center text-sm text-arse-black/70">
                Enter your email and we will send a password reset link.
              </p>
              {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}
              {resetStatus ? <p className="text-center text-sm text-emerald-700">{resetStatus}</p> : null}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isResetting}
                  className={cn(
                    "inline-flex w-full items-center justify-center rounded-full border-2 border-arse-black bg-arse-pink px-4 py-3.5 text-arse-black",
                    "font-arse-title text-xs font-bold uppercase tracking-wide",
                    "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  {isResetting ? "Sending reset email..." : "Send reset link"}
                </button>
                <button
                  type="button"
                  onClick={showSignInMode}
                  className="mt-3 w-full text-center font-arse-title text-xs font-semibold uppercase tracking-[0.2em] text-arse-black/75 underline decoration-arse-pink decoration-2 underline-offset-4 hover:text-arse-pink"
                >
                  Back to sign in
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
            href="https://mail.google.com/mail/?view=cm&fs=1&to=smart-arse@disrupt-insight.com"
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
