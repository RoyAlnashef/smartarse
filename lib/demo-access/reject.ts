import type { SupabaseClient } from "@supabase/supabase-js"
import { sendDemoRejectionEmail } from "@/lib/demo-access/email"
import { getDemoAccessRequestById } from "@/lib/demo-access/request-service"

export type RejectDemoRequestResult =
  | { ok: true; kind: "rejected" }
  | { ok: true; kind: "already_rejected" }
  | { ok: false; reason: string }

export async function rejectDemoAccessRequest(
  adminClient: SupabaseClient,
  requestId: string
): Promise<RejectDemoRequestResult> {
  const row = await getDemoAccessRequestById(adminClient, requestId)
  if (!row) {
    return { ok: false, reason: "Request not found." }
  }

  if (row.status === "rejected") {
    return { ok: true, kind: "already_rejected" }
  }

  if (row.status !== "pending") {
    return {
      ok: false,
      reason: `This request can no longer be rejected (status: ${row.status}).`,
    }
  }

  const now = new Date().toISOString()
  const { error } = await adminClient
    .from("demo_access_requests")
    .update({
      status: "rejected",
      rejected_at: now,
    })
    .eq("id", requestId)
    .eq("status", "pending")

  if (error) {
    return { ok: false, reason: error.message }
  }

  const emailResult = await sendDemoRejectionEmail({ to: row.email })
  if (!emailResult.ok) {
    return { ok: false, reason: emailResult.error }
  }

  return { ok: true, kind: "rejected" }
}

export function rejectResultMessage(
  result: RejectDemoRequestResult
): { title: string; message: string; isError: boolean } {
  if (!result.ok) {
    return { title: "Rejection failed", message: result.reason, isError: true }
  }
  if (result.kind === "already_rejected") {
    return {
      title: "Already rejected",
      message: "This request was already rejected.",
      isError: false,
    }
  }
  return {
    title: "Rejected",
    message: "The prospect has been notified by email.",
    isError: false,
  }
}
