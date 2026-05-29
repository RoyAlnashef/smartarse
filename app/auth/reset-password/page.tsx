"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { establishSessionFromUrl } from "@/lib/supabase/session-from-url"

type ResetPhase = "establishing" | "ready" | "failed"

export default function ResetPasswordPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [phase, setPhase] = useState<ResetPhase>("establishing")
  const [establishError, setEstablishError] = useState<string | null>(null)

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
        setEstablishError(result.message ?? "Could not verify reset link.")
        setPhase("failed")
        return
      }

      setPhase("ready")
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (phase !== "ready" || isLoading || !user) return
    router.replace(user.role === "admin" ? "/settings" : "/client/settings")
  }, [phase, isLoading, router, user])

  const isWorking = phase === "establishing" || isLoading || (phase === "ready" && !user)

  if (isWorking) {
    return (
      <div className="arse-surface-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="arse-surface-bg flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border-2 border-arse-black/10 bg-white p-6 text-center">
          <p className="font-arse-title text-lg font-semibold text-arse-black">
            Invalid or expired reset link
          </p>
          <p className="mt-2 text-sm text-arse-black/70">
            {establishError ?? "Request a new password reset email from sign in."}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full border-2 border-arse-black bg-arse-pink px-4 py-2 text-xs font-bold uppercase tracking-wide text-arse-black"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="arse-surface-bg flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
    </div>
  )
}
