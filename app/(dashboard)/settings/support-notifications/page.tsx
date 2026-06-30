"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { SettingsBlock } from "@/components/settings/settings-block"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { PlatformSettings, SupportNotificationLogEntry } from "@/lib/support-notifications/types"

const defaultSettings: PlatformSettings = {
  supportEmail: "",
  notifyCreditBalanceLow: true,
  notifyAccessExpires4Weeks: true,
  notifyAccessExpires2Weeks: true,
}

const LOGS_PAGE_SIZE = 20

const NOTIFICATION_TYPE_LABELS: Record<SupportNotificationLogEntry["notification_type"], string> = {
  credit_balance_low: "Low credits",
  access_expires_4_weeks: "28 days left",
  access_expires_2_weeks: "14 days left",
}

function formatSentAt(sentAt: string | null): string {
  if (!sentAt) return "—"
  return new Date(sentAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function SupportNotificationsSettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"settings" | "logs">("settings")

  // Settings state
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(null)

  // Logs state
  const [logs, setLogs] = useState<SupportNotificationLogEntry[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logsLoadError, setLogsLoadError] = useState<string | null>(null)
  const [logsTruncated, setLogsTruncated] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const logsFetchedRef = useRef(false)

  const isAdmin = user?.role === "admin"

  const logsTotalPages = Math.max(1, Math.ceil(logs.length / LOGS_PAGE_SIZE))
  const paginatedLogs = useMemo(() => {
    const start = (logsPage - 1) * LOGS_PAGE_SIZE
    return logs.slice(start, start + LOGS_PAGE_SIZE)
  }, [logs, logsPage])

  const getAuthToken = useCallback(async (): Promise<string> => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error("Supabase client is not configured.")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error("Session expired. Sign in again.")
    return session.access_token
  }, [])

  const loadSettings = useCallback(async () => {
    const token = await getAuthToken()
    const res = await fetch("/api/admin/platform-settings", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to load platform notification settings.")
    const data = (await res.json()) as { settings: PlatformSettings }
    setSettings(data.settings)
  }, [getAuthToken])

  const loadLogs = useCallback(async () => {
    const token = await getAuthToken()
    const res = await fetch("/api/admin/support-notification-logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? "Failed to load support notification logs.")
    }
    const data = (await res.json()) as { logs: SupportNotificationLogEntry[]; truncated: boolean }
    setLogs(data.logs)
    setLogsTruncated(data.truncated)
  }, [getAuthToken])

  useEffect(() => {
    if (!isAdmin) {
      setIsLoadingSettings(false)
      return
    }

    let cancelled = false
    void (async () => {
      setIsLoadingSettings(true)
      setSettingsLoadError(null)
      try {
        await loadSettings()
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load platform notification settings."
          setSettingsLoadError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setIsLoadingSettings(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAdmin, loadSettings])

  useEffect(() => {
    if (!isAdmin || activeTab !== "logs" || logsFetchedRef.current) return

    logsFetchedRef.current = true
    let cancelled = false

    void (async () => {
      setIsLoadingLogs(true)
      setLogsLoadError(null)
      try {
        await loadLogs()
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to load support notification logs."
          setLogsLoadError(message)
        }
      } finally {
        if (!cancelled) setIsLoadingLogs(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAdmin, activeTab, loadLogs])

  useEffect(() => {
    setLogsPage((page) => Math.min(page, logsTotalPages))
  }, [logsTotalPages])

  async function handleSave() {
    setIsSaving(true)
    try {
      const token = await getAuthToken()
      const res = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
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
      toast.error(error instanceof Error ? error.message : "Failed to save settings.")
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Support notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure automated emails to the Disrupt support inbox for low credits and upcoming
          project access expiry.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "settings" | "logs")}
      >
        <TabsList variant="line" aria-label="Support notifications sections">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          {isLoadingSettings ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : settingsLoadError ? (
            <p className="text-sm text-destructive">{settingsLoadError}</p>
          ) : (
            <div className="space-y-8">
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
                        Live projects with an access end date exactly 28 London calendar days away.
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
                        Live projects with an access end date exactly 14 London calendar days away.
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          {isLoadingLogs ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : logsLoadError ? (
            <p className="text-sm text-destructive">{logsLoadError}</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No support emails have been sent yet.</p>
          ) : (
            <div className="space-y-3">
              {logsTruncated && (
                <p className="text-xs text-muted-foreground">
                  Showing the 200 most recent entries.
                </p>
              )}
              <div className="overflow-hidden rounded-lg border border-border bg-white">
                <table className="w-full table-fixed bg-white text-sm">
                  <thead>
                    <tr className="border-b border-border bg-white">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Sent
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Project
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="bg-white">
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                          {formatSentAt(log.sent_at)}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {NOTIFICATION_TYPE_LABELS[log.notification_type]}
                        </td>
                        <td className="max-w-0 px-4 py-3">
                          <p className="truncate text-foreground" title={log.project_name}>
                            {log.project_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{log.organization_name}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length > LOGS_PAGE_SIZE && (
                  <ListPagination
                    currentPage={logsPage}
                    totalItems={logs.length}
                    pageSize={LOGS_PAGE_SIZE}
                    onPageChange={setLogsPage}
                    className="bg-white"
                  />
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
