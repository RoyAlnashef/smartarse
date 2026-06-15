"use client"

import { Suspense } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DemoRequestPage } from "@/components/demo-request-page"

function RootPageContent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role === "admin" ? "/dashboard" : "/client/projects")
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="arse-surface-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="arse-surface-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
      </div>
    )
  }

  return <DemoRequestPage />
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="arse-surface-bg flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  )
}
