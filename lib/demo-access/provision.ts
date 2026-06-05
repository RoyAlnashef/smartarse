import type { SupabaseClient } from "@supabase/supabase-js"
import { getAppBaseUrl } from "@/lib/demo-access/config"
import {
  ensureProjectUserAssignment,
  getActiveDemoProject,
} from "@/lib/demo-access/demo-project"
import { sendDemoMagicLinkEmail } from "@/lib/demo-access/email"
import { displayNameFromDemoRequest } from "@/lib/demo-access/password-setup"
import { getDemoAccessRequestById } from "@/lib/demo-access/request-service"

export type ApproveDemoRequestResult =
  | { ok: true; kind: "approved"; email: string }
  | { ok: true; kind: "already_approved" | "already_sent" }
  | { ok: false; reason: string }

async function findAuthUserIdByEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  let page = 1
  const perPage = 200

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) throw new Error(error.message)
    const match = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalized
    )
    if (match) return match.id
    if (data.users.length < perPage) break
    page += 1
  }
  return null
}

async function ensureDemoUser(
  adminClient: SupabaseClient,
  email: string,
  organizationId: string,
  displayName: string
): Promise<string> {
  const demoAppMetadata = {
    admin_provisioned: true,
    demo_user: true,
    requires_password_setup: true,
  }
  let userId = await findAuthUserIdByEmail(adminClient, email)

  if (!userId) {
    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          admin_provisioned: true,
        },
        app_metadata: demoAppMetadata,
      })
    if (createError || !created.user) {
      throw new Error(createError?.message ?? "Failed to create auth user.")
    }
    userId = created.user.id
  } else {
    const { error: updateMetaError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        app_metadata: demoAppMetadata,
        user_metadata: { admin_provisioned: true, full_name: displayName },
      }
    )
    if (updateMetaError) {
      throw new Error(updateMetaError.message)
    }
  }

  const { error: upsertError } = await adminClient.from("users").upsert(
    {
      id: userId,
      email,
      name: displayName,
      role: "user",
      organization_id: organizationId,
      status: "active",
    },
    { onConflict: "id" }
  )

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  return userId
}

export async function approveDemoAccessRequest(
  adminClient: SupabaseClient,
  requestId: string
): Promise<ApproveDemoRequestResult> {
  const row = await getDemoAccessRequestById(adminClient, requestId)
  if (!row) {
    return { ok: false, reason: "Request not found." }
  }

  if (row.status === "magic_link_sent") {
    return { ok: true, kind: "already_sent" }
  }
  if (row.status === "approved") {
    return { ok: true, kind: "already_approved" }
  }
  if (row.status !== "pending") {
    return {
      ok: false,
      reason: `This request can no longer be approved (status: ${row.status}).`,
    }
  }

  const demoProject = await getActiveDemoProject(adminClient)
  if (!demoProject) {
    return {
      ok: false,
      reason:
        "No demo project is configured. An admin must set one in project settings.",
    }
  }

  const now = new Date().toISOString()

  const { error: approveMarkError } = await adminClient
    .from("demo_access_requests")
    .update({
      status: "approved",
      approved_at: now,
    })
    .eq("id", requestId)
    .eq("status", "pending")

  if (approveMarkError) {
    return { ok: false, reason: approveMarkError.message }
  }

  const displayName = displayNameFromDemoRequest(row)

  let userId: string
  try {
    userId = await ensureDemoUser(
      adminClient,
      row.email,
      demoProject.organizationId,
      displayName
    )
    await ensureProjectUserAssignment(adminClient, demoProject.id, userId)

    await adminClient
      .from("demo_access_requests")
      .update({ user_id: userId })
      .eq("id", requestId)
  } catch (error) {
    await adminClient
      .from("demo_access_requests")
      .update({ status: "pending", approved_at: null })
      .eq("id", requestId)
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Provisioning failed.",
    }
  }

  const redirectTo = `${getAppBaseUrl()}/auth/demo-setup`
  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: row.email,
      options: { redirectTo },
    })

  if (linkError || !linkData.properties?.action_link) {
    return {
      ok: false,
      reason: linkError?.message ?? "Failed to generate magic link.",
    }
  }

  const emailResult = await sendDemoMagicLinkEmail({
    to: row.email,
    magicLink: linkData.properties.action_link,
  })

  if (!emailResult.ok) {
    return { ok: false, reason: emailResult.error }
  }

  const sentAt = new Date().toISOString()
  await adminClient
    .from("demo_access_requests")
    .update({
      status: "magic_link_sent",
      user_id: userId,
      magic_link_sent_at: sentAt,
      provisioned_project_id: demoProject.id,
    })
    .eq("id", requestId)

  return { ok: true, kind: "approved", email: row.email }
}

export function approveResultMessage(
  result: ApproveDemoRequestResult
): { title: string; message: string; isError: boolean } {
  if (!result.ok) {
    return { title: "Approval failed", message: result.reason, isError: true }
  }
  switch (result.kind) {
    case "already_sent":
      return {
        title: "Already sent",
        message: "An activation link was already emailed to this prospect.",
        isError: false,
      }
    case "already_approved":
      return {
        title: "Already approved",
        message: "This request was already approved.",
        isError: false,
      }
    default:
      return {
        title: "Approved",
        message: `An activation link has been sent to ${result.email}.`,
        isError: false,
      }
  }
}
