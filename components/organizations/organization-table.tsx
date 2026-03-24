"use client"

import { Ban, Coins, Edit } from "lucide-react"
import type { Organization } from "@/lib/types"

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

function orgInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function OrganizationTable({
  organizations,
  onEdit,
  onDeactivate,
}: {
  organizations: Organization[]
  onEdit: (org: Organization) => void
  onDeactivate?: (org: Organization) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 font-medium text-muted-foreground">Organization</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">
                Projects
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">
                Users
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground lg:table-cell">
                Credits
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Created
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {organizations.map((org) => (
              <tr key={org.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-100 text-sm font-medium text-dark-600">
                      {orgInitials(org.name)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{org.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {org.creditBalance} credits · {org.projectIds.length} projects ·{" "}
                        {org.userIds.length} users
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {org.projectIds.length}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {org.userIds.length}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 shrink-0 text-mint-500" aria-hidden />
                    <span className="font-medium tabular-nums text-foreground">
                      {org.creditBalance}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {formatDate(org.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[org.status]}`}
                  >
                    {org.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onDeactivate && org.status === "active" && (
                      <button
                        type="button"
                        onClick={() => onDeactivate(org)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-700"
                        title="Deactivate organization"
                      >
                        <Ban className="h-4 w-4" />
                        <span className="sr-only">Deactivate {org.name}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(org)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit {org.name}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
