import type { SupabaseClient } from "@supabase/supabase-js"
import { getDemoRedirectPathForUser } from "@/lib/demo-access/session"

export type RecordDemoFirstLoginResult = {
  updated: boolean
  redirectPath: string | null
}

export async function recordDemoFirstLoginIfNeeded(
  adminClient: SupabaseClient,
  options: { userId: string; email: string }
): Promise<RecordDemoFirstLoginResult> {
  const redirectPath = await getDemoRedirectPathForUser(
    adminClient,
    options.userId
  )

  if (!redirectPath) {
    return { updated: false, redirectPath: null }
  }

  const email = options.email.trim().toLowerCase()
  const { data: row, error: fetchError } = await adminClient
    .from("demo_access_requests")
    .select("id, first_login_at")
    .eq("user_id", options.userId)
    .eq("email", email)
    .not("provisioned_project_id", "is", null)
    .order("magic_link_sent_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (fetchError || !row) {
    return { updated: false, redirectPath }
  }

  if (row.first_login_at) {
    return { updated: false, redirectPath }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await adminClient
    .from("demo_access_requests")
    .update({
      first_login_at: now,
      user_id: options.userId,
    })
    .eq("id", row.id)
    .is("first_login_at", null)

  return { updated: !updateError, redirectPath }
}
