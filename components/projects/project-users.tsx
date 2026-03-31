"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { DASHBOARD_MAIN_ACCENT_CLASS } from "@/lib/constants"
import {
  assignProjectUser,
  unassignProjectUser,
} from "@/lib/supabase/projects"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { userRoleBadgeClassName } from "@/lib/user-role-badge"
import type { Project, User } from "@/lib/types"

export interface ProjectUsersProps {
  project: Project
  allUsers: User[]
  /** Optional refetch after a successful assign/remove (e.g. reload project from Supabase). */
  onAssignmentsChange?: () => void | Promise<void>
}

type PendingToggle = { user: User; assign: boolean }

export function ProjectUsers({
  project,
  allUsers,
  onAssignmentsChange,
}: ProjectUsersProps) {
  const [assignedIds, setAssignedIds] = useState(
    () => new Set(project.assignedUserIds)
  )
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null
  )
  const [savingUserId, setSavingUserId] = useState<string | null>(null)

  const persistToSupabase = !!getSupabaseBrowserClient()

  useEffect(() => {
    setAssignedIds(new Set(project.assignedUserIds))
  }, [project.id, project.assignedUserIds.join("\0")])

  const eligibleUsers = useMemo(
    () =>
      allUsers.filter(
        (u) => u.clientId != null && u.clientId === project.clientId
      ),
    [allUsers, project.clientId]
  )

  const sorted = useMemo(() => {
    return [...eligibleUsers].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    )
  }, [eligibleUsers])

  const applyAssignment = (user: User, assign: boolean) => {
    if (user.status === "inactive" && assign) return
    setAssignedIds((prev) => {
      const nextSet = new Set(prev)
      if (assign) nextSet.add(user.id)
      else nextSet.delete(user.id)
      return nextSet
    })
  }

  const requestToggle = (user: User, next: boolean) => {
    if (user.status === "inactive" && next) return
    setPendingToggle({ user, assign: next })
  }

  const confirmPendingToggle = async () => {
    if (!pendingToggle) return
    const { user: targetUser, assign } = pendingToggle
    setPendingToggle(null)

    const previous = new Set(assignedIds)
    applyAssignment(targetUser, assign)

    if (!persistToSupabase) return

    setSavingUserId(targetUser.id)
    try {
      if (assign) {
        await assignProjectUser(project.id, targetUser.id)
      } else {
        await unassignProjectUser(project.id, targetUser.id)
      }
      await onAssignmentsChange?.()
    } catch (err: unknown) {
      setAssignedIds(previous)
      toast.error(
        err instanceof Error ? err.message : "Failed to update project member"
      )
    } finally {
      setSavingUserId(null)
    }
  }

  const dismissPendingToggle = () => {
    setPendingToggle(null)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Project members
      </h2>
      <p className="text-sm text-muted-foreground">
        Assign members of{" "}
        <span className="font-medium text-foreground">{project.clientName}</span>{" "}
        to work on the project.
        {!persistToSupabase && <> Connect Supabase to persist assignments.</>}
      </p>
      <div className="rounded-xl border border-border bg-card px-0 py-0">
        {eligibleUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            No members in this organization yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((user) => {
              const isAssigned = assignedIds.has(user.id)
              const blockNewAssign = user.status === "inactive" && !isAssigned
              const popoverOpen =
                pendingToggle != null && pendingToggle.user.id === user.id
              const rowBusy = savingUserId === user.id

              return (
                <li
                  key={user.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4",
                    user.status === "inactive" && "bg-muted/20"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-medium text-foreground",
                          user.status === "inactive" &&
                            "text-muted-foreground"
                        )}
                      >
                        {user.name}
                      </span>
                      <span className={userRoleBadgeClassName(user.role)}>
                        {user.role}
                      </span>
                      {user.status === "inactive" ? (
                        <span className="inline-flex items-center rounded-full bg-dark-100 px-2 py-0.5 text-xs font-medium capitalize text-dark-500">
                          inactive
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    {blockNewAssign ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Inactive users cannot be newly assigned.
                      </p>
                    ) : null}
                  </div>
                  <Popover
                    modal={false}
                    open={popoverOpen}
                    onOpenChange={(open) => {
                      if (!open) dismissPendingToggle()
                    }}
                  >
                    <PopoverAnchor asChild>
                      <div className="inline-flex shrink-0">
                        <Switch
                          checked={isAssigned}
                          disabled={blockNewAssign || rowBusy}
                          onCheckedChange={(v) => {
                            if (popoverOpen) {
                              dismissPendingToggle()
                              return
                            }
                            requestToggle(user, v)
                          }}
                          aria-label={
                            isAssigned
                              ? `Request to remove ${user.name} from project`
                              : `Request to assign ${user.name} to project`
                          }
                        />
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      align="center"
                      side="left"
                      sideOffset={8}
                      className={cn("w-80 p-4", DASHBOARD_MAIN_ACCENT_CLASS)}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      {pendingToggle?.user.id === user.id ? (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold text-foreground">
                              {pendingToggle.assign
                                ? `Assign ${pendingToggle.user.name}?`
                                : `Remove ${pendingToggle.user.name}?`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {pendingToggle.assign ? (
                                <>
                                  Adds them to{" "}
                                  <span className="font-medium text-foreground">
                                    {project.name}
                                  </span>
                                  . This applies immediately after you confirm.
                                </>
                              ) : (
                                <>
                                  Removes them from{" "}
                                  <span className="font-medium text-foreground">
                                    {project.name}
                                  </span>
                                  . They lose access immediately after you
                                  confirm (for roles limited to assigned
                                  projects).
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={rowBusy}
                              onClick={dismissPendingToggle}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={rowBusy}
                              onClick={() => void confirmPendingToggle()}
                            >
                              {rowBusy
                                ? "Saving…"
                                : pendingToggle.assign
                                  ? "Assign"
                                  : "Remove"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
