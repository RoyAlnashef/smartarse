"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SettingsBlock } from "@/components/settings/settings-block"

export type ChangePasswordValues = {
  newPassword: string
  confirmPassword: string
}

export function ChangePasswordForm({
  onSave,
  savingLabel = "Saving…",
  className,
}: {
  className?: string
  savingLabel?: string
  onSave?: (values: ChangePasswordValues) => Promise<void> | void
}) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const canSubmit = useMemo(() => {
    return (
      newPassword.trim().length > 0 &&
      confirmPassword.trim().length > 0 &&
      !isSaving
    )
  }, [confirmPassword, isSaving, newPassword])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const values: ChangePasswordValues = {
      newPassword,
      confirmPassword,
    }

    if (values.newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }
    if (values.newPassword !== values.confirmPassword) {
      setError("New password and confirmation do not match.")
      return
    }

    setIsSaving(true)
    try {
      await onSave?.(values)
      setSuccess("Password updated successfully (mock).")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError("Could not update password. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SettingsBlock
      className={className}
      title="Change Password"
      description="Update your credentials for this client account."
      icon={<Lock className="h-5 w-5 text-muted-foreground" />}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm font-medium text-mint-500">{success}</p>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={!canSubmit}>
            {isSaving ? savingLabel : "Save"}
          </Button>
        </div>
      </form>
    </SettingsBlock>
  )
}

