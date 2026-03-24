"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { listOrganizationsForDashboard } from "@/lib/supabase/organizations"
import { createProject } from "@/lib/supabase/projects"
import type { Organization } from "@/lib/types"

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgId, setOrgId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingOrgs(true)
    listOrganizationsForDashboard()
      .then((rows) => {
        setOrgs(rows)
        setOrgId((prev) => (prev && rows.some((o) => o.id === prev) ? prev : rows[0]?.id ?? ""))
      })
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Failed to load organizations.")
      )
      .finally(() => setLoadingOrgs(false))
  }, [open])

  useEffect(() => {
    if (!open) {
      setName("")
      setDescription("")
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId.trim() || !name.trim() || saving) return
    setSaving(true)
    try {
      await createProject({
        organizationId: orgId,
        name: name.trim(),
        description: description.trim(),
      })
      toast.success("Project created.")
      onCreated()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create project.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add project</DialogTitle>
            <DialogDescription>
              Create a project under an organization. Members and uploads can be managed after
              creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-org">Organization</Label>
              <select
                id="project-org"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                disabled={loadingOrgs || orgs.length === 0}
              >
                {orgs.length === 0 && !loadingOrgs ? (
                  <option value="">No organizations</option>
                ) : (
                  orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                autoComplete="off"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !orgId || !name.trim()}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
