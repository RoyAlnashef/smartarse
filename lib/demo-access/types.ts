export type DemoAccessRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "magic_link_sent"
  | "expired"

export type DemoApprovalAction = "approve" | "reject"

export type DemoAccessRequestRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  organization_name: string | null
  status: DemoAccessRequestStatus
  requested_at: string
  approved_at: string | null
  rejected_at: string | null
  magic_link_sent_at: string | null
  first_login_at: string | null
  user_id: string | null
  provisioned_project_id: string | null
  metadata: Record<string, unknown> | null
}

export type DemoAccessRequestDto = {
  id: string
  email: string
  name: string | null
  organizationName: string | null
  status: DemoAccessRequestStatus
  requestedAt: string
  approvedAt: string | null
  rejectedAt: string | null
  magicLinkSentAt: string | null
  firstLoginAt: string | null
  userId: string | null
}

function formatRequestName(row: DemoAccessRequestRow): string | null {
  const parts = [row.first_name, row.last_name]
    .map((s) => s?.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : null
}

export function toDemoAccessRequestDto(row: DemoAccessRequestRow): DemoAccessRequestDto {
  return {
    id: row.id,
    email: row.email,
    name: formatRequestName(row),
    organizationName: row.organization_name?.trim() || null,
    status: row.status,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    magicLinkSentAt: row.magic_link_sent_at,
    firstLoginAt: row.first_login_at,
    userId: row.user_id,
  }
}
