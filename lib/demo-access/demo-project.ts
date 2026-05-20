import type { SupabaseClient } from "@supabase/supabase-js"

export type ActiveDemoProject = {
  id: string
  organizationId: string
  name: string
}

export async function getActiveDemoProject(
  adminClient: SupabaseClient
): Promise<ActiveDemoProject | null> {
  const { data, error } = await adminClient
    .from("projects")
    .select("id, organization_id, name")
    .eq("is_demo", true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
  }
}

export async function setActiveDemoProject(
  adminClient: SupabaseClient,
  projectId: string
): Promise<void> {
  const { data: project, error: fetchError } = await adminClient
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!project) throw new Error("Project not found.")

  const { error: clearError } = await adminClient
    .from("projects")
    .update({ is_demo: false })
    .eq("is_demo", true)

  if (clearError) throw new Error(clearError.message)

  const { error: setError } = await adminClient
    .from("projects")
    .update({ is_demo: true })
    .eq("id", projectId)

  if (setError) throw new Error(setError.message)
}

export async function clearActiveDemoProject(
  adminClient: SupabaseClient
): Promise<void> {
  const { error } = await adminClient
    .from("projects")
    .update({ is_demo: false })
    .eq("is_demo", true)

  if (error) throw new Error(error.message)
}

export async function ensureProjectUserAssignment(
  adminClient: SupabaseClient,
  projectId: string,
  userId: string
): Promise<void> {
  const { error } = await adminClient.from("project_users").insert({
    project_id: projectId,
    user_id: userId,
  })

  if (error && error.code !== "23505") {
    throw new Error(error.message)
  }
}
