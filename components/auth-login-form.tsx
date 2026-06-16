"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  authLinkButtonClass,
  pillInputWithIconClass,
  pillPasswordInputClass,
  submitButtonClass,
} from "@/lib/auth-form-styles"
import { cn } from "@/lib/utils"
import type { User as AppUser, UserRole } from "@/lib/types"

export function postLoginPath(role: UserRole) {
  return role === "admin" ? "/dashboard" : "/client/projects"
}

type LoginFormMode = "signin" | "forgot"

type AuthLoginFormProps = {
  className?: string
  /** When set, called instead of default role-based redirect after sign-in. */
  onSuccess?: (user: AppUser) => void
  /** Hide the sign-in / reset mode headings (e.g. when tab label is enough). */
  hideHeadings?: boolean
}

export function AuthLoginForm({
  className,
  onSuccess,
  hideHeadings = false,
}: AuthLoginFormProps) {
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
      if (onSuccess) {
        onSuccess(user)
      } else {
        router.replace(postLoginPath(user.role))
      }
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
    const resetNext = encodeURIComponent("/auth/reset-password")
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${resetNext}`,
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

  if (mode === "signin") {
    return (
      <form onSubmit={handleSignInSubmit} className={cn("space-y-4 text-left", className)}>
        {hideHeadings ? null : (
          <p className="font-arse-title mb-2 text-center text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
            Login
          </p>
        )}
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
          <input
            id="auth-login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email or username"
            className={pillInputWithIconClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
          <div className="relative min-w-0 flex-1">
            <input
              id="auth-login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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

        {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}
        {resetStatus ? <p className="text-center text-sm text-emerald-700">{resetStatus}</p> : null}

        <div className="pt-2">
          <button type="submit" className={submitButtonClass}>
            Sign in
          </button>
          <button type="button" onClick={showForgotMode} className={authLinkButtonClass}>
            Forgot password?
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleForgotPasswordSubmit} className={cn("space-y-4 text-left", className)}>
      {hideHeadings ? null : (
        <p className="font-arse-title mb-2 text-center text-sm font-bold uppercase tracking-[0.35em] text-arse-pink">
          Reset Password
        </p>
      )}
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 shrink-0 text-arse-pink" strokeWidth={1.75} aria-hidden />
        <input
          id="auth-reset-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className={pillInputWithIconClass}
        />
      </div>
      <p className="text-center text-sm text-arse-black/70">
        Enter your email and we will send a password reset link.
      </p>
      {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}
      {resetStatus ? <p className="text-center text-sm text-emerald-700">{resetStatus}</p> : null}
      <div className="pt-2">
        <button type="submit" disabled={isResetting} className={submitButtonClass}>
          {isResetting ? "Sending reset email..." : "Send reset link"}
        </button>
        <button type="button" onClick={showSignInMode} className={authLinkButtonClass}>
          Back to sign in
        </button>
      </div>
    </form>
  )
}
