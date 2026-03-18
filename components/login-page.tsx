"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"

const quickLogins: { role: UserRole; label: string; email: string; description: string }[] = [
  { role: "admin", label: "Admin", email: "sarah@disrupt-insight.com", description: "Full system access" },
  { role: "client", label: "Client", email: "marcus@acmeretail.com", description: "Client project view" },
  { role: "user", label: "User", email: "david@acmeretail.com", description: "Assigned projects only" },
]

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const success = login(email)
    if (success) {
      router.push("/dashboard")
    } else {
      setError("Account not found. Try a demo login below.")
    }
  }

  function handleQuickLogin(email: string) {
    login(email)
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden flex-col justify-between bg-dark-950 p-12 lg:flex lg:w-1/2">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-300">
              <span className="font-serif text-lg font-bold text-dark-950">D</span>
            </div>
            <span className="text-2xl font-semibold text-white">Disrupt</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-balance text-5xl font-bold leading-tight text-white">
            Not business
            <br />
            <span className="text-mint-300">as usual.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-dark-300">
            Turn your market research into actionable intelligence. Ask questions, uncover insights, and make data-driven decisions with AI.
          </p>
        </div>

        <p className="text-sm text-dark-400">
          Disrupt Insight Ltd. All rights reserved.
        </p>
      </div>

      {/* Right panel - login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-950">
            <span className="font-serif text-lg font-bold text-mint-300">D</span>
          </div>
          <span className="text-2xl font-semibold text-foreground">Disrupt</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-foreground">Sign in to your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access the platform
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground shadow-sm focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground shadow-sm focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-dark-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-800"
            >
              Sign in
            </button>
          </form>

          {/* Quick demo logins */}
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-3 text-muted-foreground">
                  Quick demo access
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {quickLogins.map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleQuickLogin(item.email)}
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-mint-400 hover:bg-mint-50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground transition-colors group-hover:text-mint-600">
                    {item.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
