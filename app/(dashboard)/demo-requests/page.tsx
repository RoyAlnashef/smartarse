"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { DemoAccessRequestDto, DemoAccessRequestStatus } from "@/lib/demo-access/types"
import { DemoRequestsDemoProjectBanner } from "@/components/dashboard/demo-requests-demo-project-banner"
import {
  DemoRequestsTable,
  DemoRequestsTableSkeleton,
} from "@/components/dashboard/demo-requests-table"

const STATUS_FILTER_OPTIONS: {
  value: DemoAccessRequestStatus | "all"
  label: string
}[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "magic_link_sent", label: "Link sent" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
]

export default function DemoRequestsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<DemoAccessRequestDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<DemoAccessRequestStatus | "all">(
    "all"
  )
  const [actingId, setActingId] = useState<string | null>(null)

  const isAdmin = user?.role === "admin"

  const loadRequests = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setItems([])
      throw new Error("Supabase client is not configured.")
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error("Session expired. Sign in again.")
    }

    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)

    const res = await fetch(`/api/admin/demo-requests?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      throw new Error("Failed to load demo requests.")
    }

    const data = (await res.json()) as { items: DemoAccessRequestDto[] }
    setItems(data.items)
  }, [statusFilter])

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
        await loadRequests()
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to load demo requests."
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
  }, [isAdmin, loadRequests])

  const emptyMessage = useMemo(() => {
    if (statusFilter === "all") return "No demo requests yet."
    const label =
      STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ??
      statusFilter.replace(/_/g, " ")
    return `No ${label.toLowerCase()} requests.`
  }, [statusFilter])

  async function runAction(id: string, action: "approve" | "reject") {
    if (action === "reject") {
      const confirmed = window.confirm(
        "Reject this demo request? The prospect will receive a plain-text email."
      )
      if (!confirmed) return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast.error("Session expired. Sign in again.")
      return
    }

    setActingId(id)
    try {
      const res = await fetch(`/api/admin/demo-requests/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = (await res.json()) as { error?: string; message?: string }
      if (!res.ok) {
        toast.error(body.error ?? `Failed to ${action} request.`)
        return
      }
      toast.success(body.message ?? `Request ${action}d.`)
      await loadRequests()
    } catch {
      toast.error(`Failed to ${action} request.`)
    } finally {
      setActingId(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          Only admins can manage demo requests.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Demo requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prospect signups awaiting approval or already provisioned.
          </p>
        </div>
      </div>

      <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-dark-950 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <DemoRequestsDemoProjectBanner />

      {isLoading && <DemoRequestsTableSkeleton />}
      {loadError && (
        <p className="text-sm text-red-600">Could not load data: {loadError}</p>
      )}

      {!isLoading && !loadError && (
        <DemoRequestsTable
          items={items}
          actingId={actingId}
          emptyMessage={emptyMessage}
          onApprove={(id) => void runAction(id, "approve")}
          onReject={(id) => void runAction(id, "reject")}
        />
      )}
    </div>
  )
}
