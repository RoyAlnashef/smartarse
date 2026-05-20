import type { SupabaseClient } from "@supabase/supabase-js"
import { getAppBaseUrl } from "@/lib/demo-access/config"
import { getSupportNotificationEmail } from "@/lib/support-notification-email"
import { sendDemoRequestNotificationEmail } from "@/lib/demo-access/email"
import { buildDemoActionUrl } from "@/lib/demo-access/tokens"
import type { DemoAccessRequestRow } from "@/lib/demo-access/types"

const RATE_LIMIT_PER_HOUR = 3

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function countRecentRequestsForEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error } = await adminClient
    .from("demo_access_requests")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("requested_at", since)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function findPendingRequestByEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<DemoAccessRequestRow | null> {
  const { data, error } = await adminClient
    .from("demo_access_requests")
    .select("*")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as DemoAccessRequestRow | null) ?? null
}

export async function createDemoAccessRequest(
  adminClient: SupabaseClient,
  options: {
    email: string
    metadata?: Record<string, unknown>
  }
): Promise<
  | { ok: true; row: DemoAccessRequestRow; notified: boolean }
  | { ok: false; reason: "rate_limited" }
> {
  const email = normalizeEmail(options.email)
  const recentCount = await countRecentRequestsForEmail(adminClient, email)
  if (recentCount >= RATE_LIMIT_PER_HOUR) {
    return { ok: false, reason: "rate_limited" }
  }

  const existingPending = await findPendingRequestByEmail(adminClient, email)
  if (existingPending) {
    const notified = await notifyDisruptForRequest(existingPending)
    return { ok: true, row: existingPending, notified }
  }

  const { data, error } = await adminClient
    .from("demo_access_requests")
    .insert({
      email,
      status: "pending",
      metadata: options.metadata ?? {},
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      const pending = await findPendingRequestByEmail(adminClient, email)
      if (pending) {
        const notified = await notifyDisruptForRequest(pending)
        return { ok: true, row: pending, notified }
      }
    }
    throw new Error(error.message)
  }

  const row = data as DemoAccessRequestRow
  const notified = await notifyDisruptForRequest(row)
  return { ok: true, row, notified }
}

async function notifyDisruptForRequest(
  row: DemoAccessRequestRow
): Promise<boolean> {
  const baseUrl = getAppBaseUrl()
  const approveUrl = buildDemoActionUrl(row.id, "approve", baseUrl)
  const rejectUrl = buildDemoActionUrl(row.id, "reject", baseUrl)
  if (!approveUrl || !rejectUrl) return false

  const result = await sendDemoRequestNotificationEmail({
    requesterEmail: row.email,
    requestedAt: row.requested_at,
    approveUrl,
    rejectUrl,
  })
  if (!result.ok) {
    console.error(
      "[demo/request] notification email failed:",
      result.error,
      "→",
      getSupportNotificationEmail()
    )
  }
  return result.ok
}

export async function getDemoAccessRequestById(
  adminClient: SupabaseClient,
  id: string
): Promise<DemoAccessRequestRow | null> {
  const { data, error } = await adminClient
    .from("demo_access_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as DemoAccessRequestRow | null) ?? null
}
