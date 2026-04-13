"use client"

import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Edit, MoreHorizontal, Trash2 } from "lucide-react"
import type { User } from "@/lib/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { initialAvatarClass } from "@/lib/avatar-palette"
import { userRoleBadgeClassName } from "@/lib/user-role-badge"

const statusColors: Record<string, string> = {
  active: "bg-mint-100 text-mint-700",
  inactive: "bg-dark-100 text-dark-500",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function UserTableSkeleton() {
  const rows = [0, 1, 2, 3]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Role</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Organization
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Last Login
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Credits spent
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Skeleton className="h-4 w-12" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="ml-auto h-7 w-7 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function UserTable({
  users,
  organizations,
  onEdit,
  onDelete,
  currentUserId,
  footer,
  creditsSort = null,
  onCreditsSortClick,
}: {
  users: User[]
  organizations: { id: string; name: string; status: "active" | "inactive" }[]
  onEdit: (user: User) => void
  onDelete?: (user: User) => void
  currentUserId?: string
  footer?: ReactNode
  creditsSort?: "desc" | "asc" | null
  onCreditsSortClick?: () => void
}) {
  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Role</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Organization</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Last Login</th>
                <th
                  className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell"
                  aria-sort={
                    creditsSort === "desc"
                      ? "descending"
                      : creditsSort === "asc"
                        ? "ascending"
                        : "none"
                  }
                >
                  {onCreditsSortClick ? (
                    <button
                      type="button"
                      onClick={onCreditsSortClick}
                      className="inline-flex w-full min-w-0 items-center justify-start gap-1.5 rounded-md text-left font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink/30"
                      aria-label={
                        creditsSort === null
                          ? "Sort by credits spent, highest first"
                          : creditsSort === "desc"
                            ? "Sort by credits spent, lowest first"
                            : "Clear credits spent sort"
                      }
                    >
                      Credits Spent
                      {creditsSort === "desc" ? (
                        <ArrowDown className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
                      ) : creditsSort === "asc" ? (
                        <ArrowUp className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                      )}
                    </button>
                  ) : (
                    "Credits spent"
                  )}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No users match your filters.
                  </td>
                </tr>
              ) : null}
              {users.map((user) => {
                const org = user.clientId
                  ? organizations.find((o) => o.id === user.clientId)
                  : null
                const isInactiveFromOrg =
                  user.status === "inactive" && org?.status === "inactive"

                const statusBadge = (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[user.status]}`}
                  >
                    {user.status}
                  </span>
                )

                return (
                  <tr key={user.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${initialAvatarClass(user.id)}`}
                        >
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={userRoleBadgeClassName(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {org ? org.name : "---"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="hidden px-4 py-3 text-left tabular-nums lg:table-cell">
                      <span className="font-semibold text-foreground">
                        {user.creditsSpentLifetime.toLocaleString()}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">spent</span>
                    </td>
                    <td className="px-4 py-3">
                      {isInactiveFromOrg ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{statusBadge}</TooltipTrigger>
                          <TooltipContent className="max-w-56 border-dark-800 bg-dark-950 text-white">
                            This user is inactive because their organization is inactive.
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        statusBadge
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open actions for {user.name}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {onDelete && user.id !== currentUserId ? (
                            <DropdownMenuItem
                              onClick={() => onDelete(user)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    </TooltipProvider>
  )
}
