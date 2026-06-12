"use client"

import { useMemo, useState } from "react"
import { User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ChangePasswordForm,
  type ChangePasswordValues,
} from "@/components/settings/change-password-form"
import { SettingsBlock } from "@/components/settings/settings-block"
import { formatLocalTime } from "@/lib/datetime"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function getSettingsStorageKey(userId: string) {
  // Mock-only persistence for the current browser session.
  return `smartA.R.S.E.clientSettings:${userId}`
}

export default function ClientSettingsPage() {
  const { user, isLoading, getClientForUser } = useAuth()
  const client = getClientForUser()

  const storageKey = useMemo(() => {
    if (!user) return null
    return getSettingsStorageKey(user.id)
  }, [user])

  // Kept as internal mock persistence for password updates only.
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  async function handleSavePassword(values: ChangePasswordValues) {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error("Supabase unavailable")

    const { error } = await supabase.auth.updateUser({
      password: values.newPassword,
    })
    if (error) throw error

    if (!user || !storageKey) return

    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        lastPasswordChangeAt: new Date().toISOString(),
        // Future: store more credential-related metadata here.
      }),
    )
    setLastSavedAt(new Date().toISOString())
  }

  const profileInitials = useMemo(() => {
    if (!user?.name) return ""
    return user.name
      .split(" ")
      .map((n) => n.trim()[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
  }, [user?.name])

  if (isLoading || !user) return null

  return (
    <div className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="font-arse-title text-3xl font-bold text-arse-black">
            Settings
          </h1>
          <p className="font-arse-body text-sm text-arse-black/60">
            Manage your credentials and SaaS preferences for this client
            account.
          </p>
        </div>

        <SettingsBlock
          title="Profile"
          description={`${client ? client.name : "Client account"} • ${
            user.role
          }`}
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-arse-pink/10 text-arse-pink">
              <span className="font-arse-title text-sm font-bold">
                {profileInitials || <User className="h-4 w-4" />}
              </span>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Full name</p>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </SettingsBlock>

        <ChangePasswordForm onSave={handleSavePassword} />

        {lastSavedAt ? (
          <p className="text-center text-xs text-muted-foreground">
            Saved at {formatLocalTime(lastSavedAt)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

