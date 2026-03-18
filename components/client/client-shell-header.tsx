"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export function ClientShellHeader() {
  const { user, logout, getClientForUser } = useAuth()
  const router = useRouter()
  const client = getClientForUser()
  const displayName = (client?.name ?? user?.name ?? "User").toUpperCase()
  const remaining = client ? client.totalCredits - client.usedCredits : 0
  const total = client?.totalCredits ?? 0

  function handleLogout() {
    logout()
    router.replace("/")
  }

  return (
    <header className="border-b-4 border-arse-black bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
          <Link
            href="/client/projects"
            title="Project list"
            className="font-serif text-xl font-bold tracking-tight text-arse-black sm:text-2xl hover:opacity-90"
          >
            disrupt
          </Link>
          <div className="hidden h-10 w-px bg-arse-black/20 sm:block" aria-hidden />
          <div className="flex items-center gap-2">
            <span className="font-arse-smart text-2xl text-arse-magenta sm:text-3xl">smart</span>
            <span className="font-arse-title text-xl font-bold tracking-[0.15em] text-arse-black sm:text-2xl">
              A.R.S.E
            </span>
            {/* Placeholder for hero graphic */}
            <span
              className="ml-1 hidden h-10 w-10 rounded-full bg-gradient-to-br from-arse-magenta/40 to-arse-cyan/60 sm:inline-block"
              aria-hidden
            />
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-arse-title text-xs font-semibold uppercase tracking-wider text-arse-black">
              Hello
            </span>
            <button
              type="button"
              className={cn(
                "rounded-full border-2 border-arse-black bg-arse-magenta px-4 py-2 font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black",
                "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]"
              )}
            >
              {displayName}
            </button>
            <Link
              href="/client/settings"
              title="Settings"
              className="rounded-lg border-2 border-transparent p-2 text-arse-black hover:border-arse-magenta/30"
            >
              <Settings className="h-5 w-5" strokeWidth={2} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="rounded-lg border-2 border-transparent p-2 text-arse-black hover:border-arse-magenta/30"
            >
              <LogOut className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {client ? (
        <div className="mx-auto mt-4 flex max-w-7xl items-center gap-3 rounded-xl border-2 border-arse-black bg-arse-magenta px-3 py-2 sm:px-4">
          <span className="font-arse-title text-xs font-bold uppercase tracking-wider text-arse-black">
            Credits
          </span>
          <div className="flex flex-1 items-center gap-2 rounded-full border-2 border-arse-black bg-arse-black px-3 py-1.5 text-arse-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-arse-white/40 text-[10px] font-bold">
              AI
            </span>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2 text-center font-arse-body text-xs font-semibold sm:justify-between sm:text-left">
              <span>Remaining {remaining}</span>
              <span className="hidden h-4 w-px bg-arse-white/40 sm:block" aria-hidden />
              <span>Total {total}</span>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
