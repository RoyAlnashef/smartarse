"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import { ArseLogoGroup } from "@/components/arse-logo-group"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const signInPillClass = cn(
  "rounded-full border-2 border-arse-black bg-arse-pink px-4 py-2 font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black",
  "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]"
)

const clientNameDivClass = cn(
  // Client name wrapper is a visual container (not a button).
  "rounded-bl-3xl border-2 border-arse-black bg-arse-pink py-2 pl-5 pr-2 font-arse-title text-lg font-medium uppercase tracking-wide text-arse-black",
  "shadow-[-4px_4px_0_0_var(--arse-cyan)]"
)

export function ClientShellHeader({ variant = "client" }: { variant?: "client" | "help" }) {
  const { user, logout, getClientForUser, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isHelp = variant === "help"
  const showGuestHelp = isHelp && (isLoading || !user)
  const client = user ? getClientForUser() : null
  const displayName = (client?.name ?? user?.name ?? "User").toUpperCase()
  const isProjectListPage = pathname === "/client/projects"

  const homeHref = isHelp && showGuestHelp ? "/" : "/client/projects"

  async function handleLogout() {
    await logout()
    router.replace("/")
  }

  return (
    <header className="bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-start lg:justify-normal lg:gap-6">
        <div className="flex flex-wrap items-center gap-4 lg:gap-8 lg:justify-self-start">
          <Link
            href={homeHref}
            title={showGuestHelp ? "Go to sign in" : "Project list"}
            className="flex max-[725px]:hidden items-center hover:opacity-90"
          >
              <img
                src="/client-header-logo.gif"
                alt="disrupt"
                className="block h-[32px] w-auto sm:h-[48px]"
                draggable={false}
              />
          </Link>
          {!isProjectListPage && (
            <div
              className="hidden h-10 w-px bg-arse-black/20 min-[726px]:block lg:hidden"
              aria-hidden
            />
          )}
          {!isProjectListPage && (
            // Mobile brand cluster (desktop brand is centered separately).
            <div className="flex items-center gap-1 sm:gap-1.5 lg:hidden">
              <span className="max-[638px]:hidden">
                <ArseLogoGroup variant="inline" showTagline={false} />
              </span>
              <span
                className="hidden sm:inline-flex sm:items-center sm:justify-center"
                aria-hidden
                title="Robot illustration"
              >
                <img
                  src="/robot.png"
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="h-[56px] w-auto translate-y-0"
                />
              </span>
            </div>
          )}
        </div>

        {!isProjectListPage && (
          <div className="hidden items-center justify-center lg:flex lg:justify-self-center">
            <span className="flex items-center gap-1 sm:gap-1.5">
              <ArseLogoGroup variant="inline" showTagline={false} />
              <span
                className="hidden sm:inline-flex sm:items-center sm:justify-center"
                aria-hidden
                title="Robot illustration"
              >
                <img
                  src="/robot.png"
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="h-[56px] w-auto translate-y-0"
                />
              </span>
            </span>
          </div>
        )}

        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4 lg:justify-self-end">
          <div
            className="flex min-w-0 max-w-full flex-wrap items-center gap-2 sm:gap-3"
            {...(showGuestHelp ? { "aria-busy": isLoading } : {})}
          >
            <span className="font-arse-title text-lg font-normal uppercase tracking-wider text-arse-black">
              Hello
            </span>
            {showGuestHelp ? (
              <Link
                href="/"
                className={cn(signInPillClass, "inline-flex items-center justify-center")}
                title="Sign in"
              >
                Sign In
              </Link>
            ) : (
              <div
                className={cn(
                  clientNameDivClass,
                  "flex min-w-0 max-w-full flex-1 items-center gap-2 sm:flex-none sm:max-w-none"
                )}
              >
                <span className="min-w-0 flex-1 truncate" title={displayName}>
                  {displayName}
                </span>
                <Link
                  href="/client/settings"
                  title="Settings"
                  aria-label="Settings"
                  className="rounded-lg p-2 text-arse-black transition hover:bg-arse-black/10"
                >
                  <Settings className="h-5 w-5" strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="rounded-lg p-2 text-arse-black transition hover:bg-arse-black/10"
                >
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credits widget moved to the Project Detail sidebar */}
    </header>
  )
}
