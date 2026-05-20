import type { SupabaseClient } from "@supabase/supabase-js"

export type DemoSessionInfo = {
  isDemoUser: boolean
  demoProjectId: string | null
}

export async function getDemoSessionForUser(
  adminClient: SupabaseClient,
  userId: string
): Promise<DemoSessionInfo> {
  const { data, error } = await adminClient
    .from("demo_access_requests")
    .select("provisioned_project_id")
    .eq("user_id", userId)
    .not("provisioned_project_id", "is", null)
    .order("magic_link_sent_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const projectId = data?.provisioned_project_id ?? null
  return {
    isDemoUser: Boolean(projectId),
    demoProjectId: projectId,
  }
}

export function demoProjectRedirectPath(projectId: string): string {
  return `/client/projects/${projectId}`
}

export async function getDemoRedirectPathForUser(
  adminClient: SupabaseClient,
  userId: string
): Promise<string | null> {
  const session = await getDemoSessionForUser(adminClient, userId)
  if (!session.demoProjectId) return null
  return demoProjectRedirectPath(session.demoProjectId)
}
