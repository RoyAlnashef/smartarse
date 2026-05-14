"use client"

import { useMemo, useState } from "react"
import { Bell, User } from "lucide-react"
import { ChangePasswordForm, type ChangePasswordValues } from "@/components/settings/change-password-form"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

export default function SettingsPage() {
  const { user } = useAuth()
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  if (!user) return null

  const profileInitials = useMemo(() => {
    return user.name
      .split(" ")
      .map((n) => n.trim()[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
  }, [user.name])

  async function handleSavePassword(values: ChangePasswordValues) {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error("Supabase unavailable")
    const { error } = await supabase.auth.updateUser({ password: values.newPassword })
    if (error) throw error
    setLastSavedAt(new Date().toISOString())
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences
        </p>
      </div>

      {/* Profile */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dark-100 text-xl font-semibold text-dark-600">
              {profileInitials}
            </div>
            <div>
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                {user.role} account
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={user.name}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
              />
            </div>
          </div>
        </div>
      </section>

      <ChangePasswordForm onSave={handleSavePassword} />

      {/* Notifications */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            {[
              { label: "Email notifications for new queries", description: "Receive alerts when new AI queries are made on your projects" },
              { label: "Weekly usage summary", description: "Get a weekly digest of platform activity and credit usage" },
              { label: "System maintenance alerts", description: "Be notified about planned downtime and updates" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <button
                  className="relative h-6 w-11 rounded-full bg-arse-pink transition-colors"
                  aria-label={`Toggle ${item.label}`}
                >
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 translate-x-5 rounded-full bg-white shadow transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button className="rounded-lg bg-dark-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dark-800">
          Save Changes
        </button>
      </div>
      {lastSavedAt ? (
        <p className="text-center text-xs text-muted-foreground">
          Password updated at {new Date(lastSavedAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  )
}
