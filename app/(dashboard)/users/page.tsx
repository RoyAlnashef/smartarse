"use client"

import { useState, useMemo } from "react"
import { Plus, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { users } from "@/lib/mock-data"
import { UserTable } from "@/components/users/user-table"
import { UserFormModal } from "@/components/users/user-form-modal"
import type { User } from "@/lib/types"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === "all" || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [search, roleFilter])

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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {["all", "admin", "client", "user"].map((r) => (
            <button
              key={r}
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

      {/* Table */}
      <UserTable
        users={filtered}
        onEdit={(u) => {
          setEditingUser(u)
          setModalOpen(true)
        }}
      />

      {/* Modal */}
      <UserFormModal
        user={editingUser}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
