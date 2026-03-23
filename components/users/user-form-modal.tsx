"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { User, UserRole } from "@/lib/types"
import { clients } from "@/lib/mock-data"

export function UserFormModal({
  user,
  open,
  onClose,
}: {
  user: User | null
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("user")
  const [clientId, setClientId] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
      setClientId(user.clientId ?? "")
    } else {
      setName("")
      setEmail("")
      setRole("user")
      setClientId("")
    }
  }, [user, open])

  if (!open) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {user ? "Edit User" : "Add User"}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium text-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                placeholder="john@company.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                >
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Organization</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={role === "admin"}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20 disabled:opacity-50"
                >
                  <option value="">None</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-dark-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800"
            >
              {user ? "Save Changes" : "Create User"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
