"use client"

import { Edit, MoreHorizontal } from "lucide-react"
import type { User } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const roleBadgeColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  client: "bg-blue-100 text-blue-700",
  user: "bg-amber-100 text-amber-700",
}

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

export function UserTable({
  users,
  organizations,
  onEdit,
}: {
  users: User[]
  organizations: { id: string; name: string; status: "active" | "inactive" }[]
  onEdit: (user: User) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">Role</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Organization</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground lg:table-cell">Last Login</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const org = user.clientId
                ? organizations.find((o) => o.id === user.clientId)
                : null
              return (
                <tr key={user.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-100 text-sm font-medium text-dark-600">
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
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[user.role]}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {org ? (
                      <div className="inline-flex items-center gap-2">
                        <span>{org.name}</span>
                        {org.status === "inactive" && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Inactive
                          </span>
                        )}
                      </div>
                    ) : (
                      "---"
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[user.status]}`}
                    >
                      {user.status}
                    </span>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
