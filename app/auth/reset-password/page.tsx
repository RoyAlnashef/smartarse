import { Suspense } from "react"
import { ResetPasswordPage } from "@/components/reset-password-page"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="arse-surface-bg flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-arse-pink border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  )
}
