"use client"

import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import type { DemoAccessRequestDto, DemoAccessRequestStatus } from "@/lib/demo-access/types"
import { formatLocalDateTime } from "@/lib/datetime"

const statusBadgeClass: Record<DemoAccessRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-mint-100 text-mint-700",
  magic_link_sent: "bg-mint-100 text-mint-700",
  rejected: "bg-dark-100 text-dark-500",
  expired: "bg-dark-100 text-dark-500",
}

const statusLabel: Record<DemoAccessRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  magic_link_sent: "Link sent",
  rejected: "Rejected",
  expired: "Expired",
}

function formatStatusLabel(status: DemoAccessRequestStatus): string {
  return statusLabel[status]
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  return formatLocalDateTime(value)
}

const thClass =
  "px-4 py-3 text-left font-medium text-muted-foreground"
const tdClass = "px-4 py-3"

export function DemoRequestsTableSkeleton() {
  const rows = [0, 1, 2, 3]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={thClass}>Name</th>
              <th className={thClass}>Organization</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Link sent</th>
              <th className={thClass}>First login</th>
              <th className={thClass}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row}>
                <td className={tdClass}>
                  <Skeleton className="h-4 w-32 max-w-full" />
                </td>
                <td className={tdClass}>
                  <Skeleton className="h-4 w-36 max-w-full" />
                </td>
                <td className={tdClass}>
                  <Skeleton className="h-4 w-48 max-w-full" />
                </td>
                <td className={tdClass}>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className={tdClass}>
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className={tdClass}>
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className={`${tdClass} text-right`}>
                  <div className="ml-auto flex justify-end gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
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

export function DemoRequestsTable({
  items,
  actingId,
  emptyMessage,
  onApprove,
  onReject,
  footer,
}: {
  items: DemoAccessRequestDto[]
  actingId: string | null
  emptyMessage: string
  onApprove: (id: string) => void
  onReject: (id: string) => void
  footer?: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={thClass}>Name</th>
              <th className={thClass}>Organization</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Link sent</th>
              <th className={thClass}>First login</th>
              <th className={thClass}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {items.map((row) => {
              const canAct = row.status === "pending"
              const busy = actingId === row.id
              return (
                <tr key={row.id}>
                  <td className={`${tdClass} font-medium text-foreground`}>
                    {row.name ?? "—"}
                  </td>
                  <td className={`${tdClass} text-muted-foreground`}>
                    {row.organizationName ?? "—"}
                  </td>
                  <td className={`${tdClass} font-medium text-foreground`}>
                    {row.email}
                  </td>
                  <td className={tdClass}>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[row.status]}`}
                    >
                      {formatStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className={`${tdClass} text-muted-foreground`}>
                    {formatDate(row.magicLinkSentAt)}
                  </td>
                  <td className={`${tdClass} text-muted-foreground`}>
                    {formatDate(row.firstLoginAt)}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    {canAct ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onApprove(row.id)}
                          className="inline-flex items-center rounded-lg bg-dark-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-dark-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onReject(row.id)}
                          className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}
