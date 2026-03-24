"use client"

import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Project, User } from "@/lib/types"

export interface ProjectUsersProps {
  project: Project
  allUsers: User[]
}

function roleLabel(role: User["role"]): string {
  if (role === "client") return "Client"
  if (role === "user") return "User"
  return role
}

type PendingToggle = { user: User; assign: boolean }

export function ProjectUsers({ project, allUsers }: ProjectUsersProps) {
  const [assignedIds, setAssignedIds] = useState(
    () => new Set(project.assignedUserIds)
  )
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(
    null
  )

  useEffect(() => {
    setAssignedIds(new Set(project.assignedUserIds))
  }, [project.id])

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

  const confirmPendingToggle = () => {
    if (!pendingToggle) return
    applyAssignment(pendingToggle.user, pendingToggle.assign)
    setPendingToggle(null)
  }

  const dismissPendingToggle = () => {
    setPendingToggle(null)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Project members
      </h2>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Only people in{" "}
          <span className="font-medium text-foreground">{project.clientName}</span>{" "}
          can be assigned to this project. Changes here are not saved yet (demo).
        </p>

        {eligibleUsers.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            No members in this organization yet.
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border border-t border-border pt-6">
          {sorted.map((user) => {
            const isAssigned = assignedIds.has(user.id)
            const blockNewAssign = user.status === "inactive" && !isAssigned
            const popoverOpen =
              pendingToggle != null && pendingToggle.user.id === user.id

            return (
              <li
                key={user.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5",
                  user.status === "inactive" && "bg-muted/20"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "font-medium text-foreground",
                        user.status === "inactive" && "text-muted-foreground"
                      )}
                    >
                      {user.name}
                    </span>
                    <Badge variant="secondary" className="font-normal">
                      {roleLabel(user.role)}
                    </Badge>
                    {user.status === "inactive" ? (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Inactive
                      </Badge>
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
                        disabled={blockNewAssign}
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
                    className="w-80 p-4"
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
                                . Access applies once this is saved in production.
                              </>
                            ) : (
                              <>
                                Removes them from{" "}
                                <span className="font-medium text-foreground">
                                  {project.name}
                                </span>
                                . They lose access once this is saved in production.
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={dismissPendingToggle}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={confirmPendingToggle}
                          >
                            {pendingToggle.assign ? "Assign" : "Remove"}
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
