"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function ResetPasswordPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !user) return
    router.replace(user.role === "admin" ? "/settings" : "/client/settings")
  }, [isLoading, router, user])

  if (isLoading) {
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
            Request a new password reset email from sign in.
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
