"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  createOrganization,
  listOrganizationsForDashboard,
  setOrganizationStatus,
  updateOrganization,
} from "@/lib/supabase/organizations"
import {
  OrganizationTable,
  OrganizationTableSkeleton,
} from "@/components/organizations/organization-table"
import {
  OrganizationFormModal,
  type OrganizationSavePayload,
} from "@/components/organizations/organization-form-modal"
import type { Organization } from "@/lib/types"

export default function OrganizationsPage() {
  const { user: currentUser } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadOrganizations() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const rows = await listOrganizationsForDashboard()
        if (!isCancelled) setOrganizations(rows)
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load organizations.")
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    void loadOrganizations()
    return () => {
      isCancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return organizations.filter((o) => {
      const matchSearch = o.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [organizations, search, statusFilter])

  async function refreshOrganizations() {
    const rows = await listOrganizationsForDashboard()
    setOrganizations(rows)
  }

  async function handleSave(payload: OrganizationSavePayload) {
    try {
      if (payload.id) {
        await updateOrganization({
          id: payload.id,
          name: payload.name,
          status: payload.status,
        })
        toast.success("Organization updated.")
      } else {
        await createOrganization(payload.name)
        toast.success("Organization created.")
      }
      await refreshOrganizations()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      toast.error(message)
      throw error
    }
  }

  async function handleDeactivate(org: Organization) {
    if (
      !window.confirm(
        `Deactivate “${org.name}”? It will be marked inactive (not deleted from the database).`
      )
    ) {
      return
    }
    try {
      await setOrganizationStatus(org.id, "inactive")
      await refreshOrganizations()
      toast.success("Organization deactivated.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not deactivate organization."
      toast.error(message)
    }
  }

  async function handleActivate(org: Organization) {
    if (!window.confirm(`Activate “${org.name}”? It will be marked active.`)) {
      return
    }
    try {
      await setOrganizationStatus(org.id, "active")
      await refreshOrganizations()
      toast.success("Organization activated.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not activate organization."
      toast.error(message)
    }
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">Only admins can manage organizations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organizations, projects, and member access
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingOrg(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-dark-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-800"
        >
          <Plus className="h-4 w-4" />
          Add Organization
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-dark-950 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <OrganizationTableSkeleton />}
      {loadError && (
        <p className="text-sm text-red-600">Could not load organizations: {loadError}</p>
      )}

      {!isLoading && !loadError && (
        <>
          <OrganizationTable
            organizations={filtered}
            onEdit={(o) => {
              setEditingOrg(o)
              setModalOpen(true)
            }}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />
        </>
      )}

      <OrganizationFormModal
        organization={editingOrg}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
