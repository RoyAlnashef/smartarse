"use client"

import { AuthLoginForm } from "@/components/auth-login-form"
import { ArseLogoGroup } from "@/components/arse-logo-group"
import { LoginFlowBackground } from "@/components/login-flow-background"
import { LegalFooterNav } from "@/components/legal/legal-footer-nav"

/** @deprecated Use unified entry at `/` with Login tab. Kept for reference only. */
export function LoginPage() {
  return (
    <div className="arse-surface-bg relative flex min-h-screen flex-col font-arse-body text-arse-black">
      <LoginFlowBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-md flex-col items-center justify-start gap-12 text-center">
          <img
            src="/client-header-logo.gif"
            alt="disrupt"
            className="mx-auto block h-[64px] w-auto sm:h-[64px]"
            draggable={false}
          />

          <ArseLogoGroup className="flex w-max max-w-full flex-col items-stretch gap-0" />

          <AuthLoginForm className="w-full max-w-xs sm:max-w-sm" />
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex flex-col items-center justify-between gap-3 px-4 py-6 font-arse-body text-[10px] font-medium uppercase tracking-wider text-arse-black sm:flex-row sm:px-8 sm:text-xs">
        <LegalFooterNav />
        <p className="text-arse-black/70">© Disrupt Insight {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
