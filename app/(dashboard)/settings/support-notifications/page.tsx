"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { SettingsBlock } from "@/components/settings/settings-block"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { PlatformSettings } from "@/lib/support-notifications/types"

const defaultSettings: PlatformSettings = {
  supportEmail: "",
  notifyCreditBalanceLow: true,
  notifyAccessExpires4Weeks: true,
  notifyAccessExpires2Weeks: true,
}

export default function SupportNotificationsSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isAdmin = user?.role === "admin"

  const loadSettings = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      throw new Error("Supabase client is not configured.")
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error("Session expired. Sign in again.")
    }

    const res = await fetch("/api/admin/platform-settings", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      throw new Error("Failed to load platform notification settings.")
    }

    const data = (await res.json()) as { settings: PlatformSettings }
    setSettings(data.settings)
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        await loadSettings()
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load platform notification settings."
          setLoadError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAdmin, loadSettings])

  async function handleSave() {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast.error("Session expired. Sign in again.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? "Failed to save settings.")
      }

      const data = (await res.json()) as { settings: PlatformSettings }
      setSettings(data.settings)
      toast.success("Support notification settings saved.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Only dashboard admins can manage support notification settings.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Support notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure automated emails to the Disrupt support inbox for low credits
          and upcoming project access expiry.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : (
        <>
          <SettingsBlock
            icon={<Bell className="h-5 w-5 text-muted-foreground" />}
            title="Support inbox"
            description="Where low-credit and access-expiry alerts are delivered."
          >
            <div>
              <label
                htmlFor="support-email"
                className="block text-sm font-medium text-foreground"
              >
                Support email
              </label>
              <input
                id="support-email"
                type="email"
                value={settings.supportEmail}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    supportEmail: event.target.value,
                  }))
                }
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
              />
            </div>
          </SettingsBlock>

          <SettingsBlock
            title="Notification types"
            description="Toggle each automated alert sent to the support inbox."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Low credit balance</p>
                  <p className="text-xs text-muted-foreground">
                    Email when a project drops below its per-project alert threshold.
                  </p>
                </div>
                <Switch
                  checked={settings.notifyCreditBalanceLow}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifyCreditBalanceLow: checked,
                    }))
                  }
                  aria-label="Toggle low credit balance notifications"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Access expires in 4 weeks</p>
                  <p className="text-xs text-muted-foreground">
                    Live projects with an access end date exactly 28 UTC calendar days away.
                  </p>
                </div>
                <Switch
                  checked={settings.notifyAccessExpires4Weeks}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifyAccessExpires4Weeks: checked,
                    }))
                  }
                  aria-label="Toggle four week access expiry notifications"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Access expires in 2 weeks</p>
                  <p className="text-xs text-muted-foreground">
                    Live projects with an access end date exactly 14 UTC calendar days away.
                  </p>
                </div>
                <Switch
                  checked={settings.notifyAccessExpires2Weeks}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifyAccessExpires2Weeks: checked,
                    }))
                  }
                  aria-label="Toggle two week access expiry notifications"
                />
              </div>
            </div>
          </SettingsBlock>

          <div className="flex justify-end">
            <Button type="button" disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
