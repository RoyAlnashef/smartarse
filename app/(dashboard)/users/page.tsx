"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { listOrganizationsForDashboard } from "@/lib/supabase/organizations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { listUsersForDashboard, updateUserAdmin } from "@/lib/supabase/users"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { UserTable, UserTableSkeleton } from "@/components/users/user-table"
import { LIST_PAGE_SIZE } from "@/lib/constants"
import {
  UserFormModal,
  type UserCreatePayload,
  type UserSavePayload,
} from "@/components/users/user-form-modal"
import type { Organization, User } from "@/lib/types"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [creditsSort, setCreditsSort] = useState<"desc" | "asc" | null>(null)

  async function refreshData() {
    const [userRows, orgRows] = await Promise.all([
      listUsersForDashboard(),
      listOrganizationsForDashboard(),
    ])
    setUsers(userRows)
    setOrganizations(orgRows)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        await refreshData()
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load users."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const organizationStatusById = new Map(organizations.map((o) => [o.id, o.status]))
    const effectiveUsers = users.map((u) => {
      const orgStatus = u.clientId ? organizationStatusById.get(u.clientId) : undefined
      const shouldBeInactive = !u.clientId || orgStatus === "inactive"
      if (shouldBeInactive && u.status !== "inactive") {
        return { ...u, status: "inactive" as const }
      }
      return u
    })

    return effectiveUsers.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === "all" || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, organizations, search, roleFilter])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, creditsSort])

  const sortedFiltered = useMemo(() => {
    if (!creditsSort) return filtered
    return [...filtered].sort((a, b) => {
      const diff = a.creditsSpentLifetime - b.creditsSpentLifetime
      return creditsSort === "desc" ? -diff : diff
    })
  }, [filtered, creditsSort])

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / LIST_PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * LIST_PAGE_SIZE
    return sortedFiltered.slice(start, start + LIST_PAGE_SIZE)
  }, [sortedFiltered, page])

  const organizationOptions = useMemo(
    () => organizations.map((o) => ({ id: o.id, name: o.name })),
    [organizations]
  )
  const organizationRows = useMemo(
    () => organizations.map((o) => ({ id: o.id, name: o.name, status: o.status })),
    [organizations]
  )

  async function handleSaveUser(payload: UserSavePayload) {
    try {
      await updateUserAdmin({
        id: payload.id,
        name: payload.name,
        role: payload.role,
        organizationId: payload.organizationId,
      })
      await refreshData()
      toast.success("User updated.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save user."
      toast.error(message)
    }
  }

  async function handleDeleteUser(user: User) {
    if (
      !window.confirm(
        `Permanently delete “${user.name}”? This cannot be undone. Their account and profile will be removed.`
      )
    ) {
      return
    }
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error("Supabase is not configured.")

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error("You must be signed in to delete users.")
      }

      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(body?.error ?? "Could not delete user.")
      }

      await refreshData()
      toast.success("User deleted.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete user."
      toast.error(message)
    }
  }

  async function handleCreateUser(payload: UserCreatePayload) {
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error("Supabase is not configured.")

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error("You must be signed in to create users.")
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(body?.error ?? "Could not create user.")
      }

      await refreshData()
      toast.success("User created.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create user."
      toast.error(message)
    }
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">Only admins can manage users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingUser(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-dark-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-800"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {["all", "admin", "client", "user"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                roleFilter === r
                  ? "bg-dark-950 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <UserTableSkeleton />}
      {loadError && (
        <p className="text-sm text-red-600">Could not load data: {loadError}</p>
      )}

      {!isLoading && !loadError && (
        <UserTable
          users={paginatedUsers}
          organizations={organizationRows}
          currentUserId={currentUser?.id}
          creditsSort={creditsSort}
          onCreditsSortClick={() => {
            setCreditsSort((prev) => {
              if (prev === null) return "desc"
              if (prev === "desc") return "asc"
              return null
            })
          }}
          onEdit={(u) => {
            setEditingUser(u)
            setModalOpen(true)
          }}
          onDelete={handleDeleteUser}
          footer={
            <ListPagination
              currentPage={page}
              totalItems={sortedFiltered.length}
              pageSize={LIST_PAGE_SIZE}
              onPageChange={setPage}
            />
          }
        />
      )}

      <UserFormModal
        user={editingUser}
        open={modalOpen}
        organizations={organizationOptions}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        onCreate={handleCreateUser}
      />
    </div>
  )
}
