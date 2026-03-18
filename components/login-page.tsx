"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/types"

const quickLogins: { role: UserRole; label: string; email: string; description: string }[] = [
  { role: "admin", label: "Admin", email: "sarah@disrupt-insight.com", description: "Full system access" },
  { role: "client", label: "Client", email: "marcus@acmeretail.com", description: "Client project view" },
  { role: "user", label: "User", email: "david@acmeretail.com", description: "Assigned projects only" },
]

function postLoginPath(role: UserRole) {
  return role === "admin" ? "/dashboard" : "/client/projects"
}

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const user = login(email)
    if (user) {
      router.replace(postLoginPath(user.role))
    } else {
      setError("Account not found. Try a demo login below.")
    }
  }

  function handleQuickLogin(emailAddr: string) {
    const user = login(emailAddr)
    if (user) router.replace(postLoginPath(user.role))
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
          {/* disrupt wordmark — placeholder until logo asset */}
          <p className="font-serif text-2xl font-bold tracking-tight text-arse-black sm:text-3xl">
            disrupt
          </p>

          <h1 className="mt-6 flex flex-wrap items-end justify-center gap-x-1 gap-y-0 text-4xl sm:text-5xl md:text-6xl">
            <span className="font-arse-smart text-arse-magenta leading-none">smart</span>
            <span className="font-arse-title font-bold tracking-[0.12em] text-arse-black">A.R.S.E</span>
          </h1>
          <p className="font-arse-title mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-arse-black sm:text-sm">
            Agentic research search engine
          </p>

          <p className="font-arse-title mt-10 text-sm font-bold uppercase tracking-[0.35em] text-arse-magenta">
            Login
          </p>

          <form onSubmit={handleSubmit} className="mt-6 w-80 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 shrink-0 text-arse-magenta" strokeWidth={1.75} aria-hidden />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or username"
                className={cn(
                  "min-h-12 flex-1 rounded-full border-2 border-arse-magenta bg-arse-white/90 px-5 py-3 text-sm text-arse-black",
                  "placeholder:text-arse-black/40",
                  "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
                )}
              />
            </div>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 shrink-0 text-arse-magenta" strokeWidth={1.75} aria-hidden />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={cn(
                  "min-h-12 flex-1 rounded-full border-2 border-arse-magenta bg-arse-white/90 px-5 py-3 text-sm text-arse-black",
                  "placeholder:text-arse-black/40",
                  "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
                )}
              />
            </div>

            {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-full bg-arse-black py-3.5 text-sm font-semibold uppercase tracking-wider text-arse-white transition hover:bg-arse-black/90"
              >
                Sign in
              </button>
            </div>
          </form>

          {/* Quick demo */}
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-arse-black/15" />
              </div>
              <p className="relative mx-auto inline-block bg-[#b8f7f7] px-3 text-xs font-medium uppercase tracking-wider text-arse-black/60">
                Quick demo access
              </p>
            </div>
            <ul className="mt-4 space-y-2">
              {quickLogins.map((item) => (
                <li key={item.role}>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(item.email)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-arse-black/20 bg-arse-white/80 px-4 py-3 text-left",
                      "transition hover:border-arse-magenta hover:bg-arse-white"
                    )}
                  >
                    <div>
                      <p className="font-arse-title text-sm font-bold text-arse-black">{item.label}</p>
                      <p className="text-xs text-arse-black/55">{item.description}</p>
                    </div>
                    <span className="max-w-[48%] truncate text-xs text-arse-black/50">{item.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-[10px] font-medium uppercase tracking-wider text-arse-black sm:flex-row sm:px-8 sm:text-xs">
        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="text-arse-black/40">|</span>
          <Link href="/help/faq" className="hover:text-arse-magenta">
            FAQ
          </Link>
          <span className="text-arse-black/40">|</span>
          <Link href="/help/privacy" className="hover:text-arse-magenta">
            Privacy policy
          </Link>
          <span className="text-arse-black/40">|</span>
          <span className="cursor-default hover:text-arse-magenta">Contact the team</span>
        </nav>
        <p className="text-arse-black/70">© Disrupt Insight {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
