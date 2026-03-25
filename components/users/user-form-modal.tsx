"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { User, UserRole } from "@/lib/types"

export type UserSavePayload = {
  id: string
  name: string
  role: UserRole
  organizationId: string
}

export type UserCreatePayload = {
  name: string
  email: string
  password: string
  role: UserRole
  organizationId: string
}

export function UserFormModal({
  user,
  open,
  organizations,
  onClose,
  onSave,
  onCreate,
}: {
  user: User | null
  open: boolean
  organizations: { id: string; name: string }[]
  onClose: () => void
  onSave?: (payload: UserSavePayload) => void | Promise<void>
  onCreate?: (payload: UserCreatePayload) => void | Promise<void>
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("user")
  const [organizationId, setOrganizationId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPassword("")
      setConfirmPassword("")
      setRole(user.role)
      setOrganizationId(user.clientId ?? "")
    } else {
      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setRole("user")
      setOrganizationId("")
    }
    setFormError(null)
  }, [user, open])

  useEffect(() => {
    if (!open) setIsSaving(false)
  }, [open])

  if (!open) return null

  const isEdit = Boolean(user)

  async function handleSubmit() {
    if (isSaving) return
    setIsSaving(true)
    setFormError(null)
    try {
      const normalizedOrgId = organizationId.trim()
      if (!normalizedOrgId) {
        setFormError("Organization is required.")
        return
      }

      if (user) {
        if (!onSave) return
        await Promise.resolve(
          onSave({
            id: user.id,
            name,
            role,
            organizationId: normalizedOrgId,
          })
        )
      } else {
        if (!onCreate) return
        if (password.length < 8) {
          setFormError("Password must be at least 8 characters.")
          return
        }
        if (password !== confirmPassword) {
          setFormError("Passwords do not match.")
          return
        }
        await Promise.resolve(
          onCreate({
            name,
            email: email.trim(),
            password,
            role,
            organizationId: normalizedOrgId,
          })
        )
      }
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save user.")
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

          <div className="space-y-4 p-6">
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Creates a Supabase Auth account and profile row in <code>public.users</code>.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground" htmlFor="user-name">
                Full name
              </label>
              <input
                id="user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
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
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isEdit}
                className={`mt-1.5 block w-full rounded-lg border border-border px-3.5 py-2.5 text-sm ${
                  isEdit
                    ? "cursor-not-allowed bg-muted/50 text-muted-foreground"
                    : "bg-background text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
                }`}
                placeholder="name@company.com"
              />
              {isEdit && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Email is managed in Supabase Auth.
                </p>
              )}
            </div>
            {!isEdit && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground" htmlFor="user-password">
                    Temporary password
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="user-password-confirm"
                  >
                    Confirm password
                  </label>
                  <input
                    id="user-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground" htmlFor="user-role">
                  Role
                </label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
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
                  className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
                >
                  <option value="">Select organization</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {isEdit ? "Cancel" : "Close"}
            </button>
            {(isEdit ? onSave : onCreate) && (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={
                  isSaving ||
                  !name.trim() ||
                  !email.trim() ||
                  (!isEdit && (!password || !confirmPassword))
                }
                className="rounded-lg bg-dark-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
