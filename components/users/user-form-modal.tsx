"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { User, UserRole } from "@/lib/types"

export type UserSavePayload = {
  id: string
  name: string
  role: UserRole
  organizationId: string | null
}

export function UserFormModal({
  user,
  open,
  organizations,
  onClose,
  onSave,
}: {
  user: User | null
  open: boolean
  organizations: { id: string; name: string }[]
  onClose: () => void
  onSave?: (payload: UserSavePayload) => void | Promise<void>
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("user")
  const [organizationId, setOrganizationId] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
      setOrganizationId(user.clientId ?? "")
    } else {
      setName("")
      setEmail("")
      setRole("user")
      setOrganizationId("")
    }
  }, [user, open])

  useEffect(() => {
    if (!open) setIsSaving(false)
  }, [open])

  if (!open) return null

  const isEdit = Boolean(user)

  async function handleSubmit() {
    if (!user || !onSave || isSaving) return
    setIsSaving(true)
    try {
      await Promise.resolve(
        onSave({
          id: user.id,
          name,
          role,
          organizationId:
            role === "admin" ? null : organizationId.trim() === "" ? null : organizationId.trim(),
        })
      )
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {isEdit ? "Edit User" : "Add User"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!isEdit ? (
            <div className="space-y-3 p-6 text-sm text-muted-foreground">
              <p>
                New accounts are created in{" "}
                <span className="font-medium text-foreground">Supabase Authentication</span>. Once a
                user appears in <code className="rounded bg-muted px-1 py-0.5 text-xs">public.users</code>
                , assign their organization from the user list.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-foreground" htmlFor="user-name">
                  Full name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground" htmlFor="user-email">
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={email}
                  readOnly
                  className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Email is managed in Supabase Auth.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground" htmlFor="user-role">
                    Role
                  </label>
                  <select
                    id="user-role"
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
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="user-organization"
                  >
                    Organization
                  </label>
                  <select
                    id="user-organization"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    disabled={role === "admin"}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-300/20 disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {isEdit ? "Cancel" : "Close"}
            </button>
            {isEdit && onSave && (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaving || !name.trim()}
                className="rounded-lg bg-dark-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
