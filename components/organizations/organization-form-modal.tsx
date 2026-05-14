"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { Organization } from "@/lib/types"

export type OrganizationSavePayload = {
  id?: string
  name: string
  projectIds: string[]
  userIds: string[]
  status: "active" | "inactive"
  createdAt?: string
}

export function OrganizationFormModal({
  organization,
  open,
  onClose,
  onSave,
}: {
  organization: Organization | null
  open: boolean
  onClose: () => void
  onSave: (payload: OrganizationSavePayload) => void | Promise<void>
}) {
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (organization) {
      setName(organization.name)
      setStatus(organization.status)
    } else {
      setName("")
      setStatus("active")
    }
  }, [organization, open])

  useEffect(() => {
    if (!open) setIsSaving(false)
  }, [open])

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed || isSaving) return
    setIsSaving(true)
    try {
      await Promise.resolve(
        onSave({
          id: organization?.id,
          name: trimmed,
          projectIds: organization?.projectIds ?? [],
          userIds: organization?.userIds ?? [],
          status,
          createdAt: organization?.createdAt,
        })
      )
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  const isEdit = Boolean(organization)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {isEdit ? "Edit Organization" : "Create an Organization"}
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
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-foreground">
                Organization name
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
                placeholder="e.g. Acme Retail"
              />
            </div>

            {isEdit && (
              <div>
                <label htmlFor="org-status" className="block text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="org-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!name.trim() || isSaving}
              className="rounded-lg bg-dark-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-800 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Organization"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
