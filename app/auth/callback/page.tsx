"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function AuthCallbackPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const recordedRef = useRef(false)

  useEffect(() => {
    if (isLoading || !user || recordedRef.current) return
    recordedRef.current = true

    void (async () => {
      let redirectPath = "/client/projects"
      try {
        const res = await fetch("/api/demo/record-first-login", {
          method: "POST",
        })
        if (res.ok) {
          const data = (await res.json()) as { redirectPath?: string | null }
          if (data.redirectPath) redirectPath = data.redirectPath
        }
      } catch {
        // Non-blocking
      }
      router.replace(redirectPath)
    })()
  }, [isLoading, user, router])

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
            Invalid or expired link
          </p>
          <p className="mt-2 text-sm text-arse-black/70">
            Request demo access or sign in with your credentials.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="inline-flex rounded-full border-2 border-arse-black bg-arse-pink px-4 py-2 text-xs font-bold uppercase tracking-wide text-arse-black"
            >
              Request demo
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full border-2 border-arse-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-arse-black"
            >
              Sign in
            </Link>
          </div>
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
