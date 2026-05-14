import { NextResponse } from "next/server"
import { createClient, type User as AuthUser } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export type ChatProfile = {
  id: string
  organization_id: string | null
  role: string
  status: string
}

export type ChatSessionOk = {
  supabase: SupabaseClient
  authUser: AuthUser
  profile: ChatProfile
}

/**
 * Authenticated dashboard user (session cookie or Bearer) with an active profile row.
 * Used by /api/chat/* — not limited to dashboard admins.
 */
export async function requireChatSession(
  request: Request
): Promise<ChatSessionOk | NextResponse<ApiError>> {
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null

  let serverClient: Awaited<ReturnType<typeof getSupabaseServerClient>>
  try {
    serverClient = await getSupabaseServerClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const {
    data: { user: sessionUser },
    error: authError,
  } = await serverClient.auth.getUser()

  let actingUser: AuthUser | null = sessionUser
  if ((authError || !actingUser) && bearerToken) {
    const { data, error } = await serverClient.auth.getUser(bearerToken)
    if (!error && data.user) {
      actingUser = data.user
    }
  }

  if (!actingUser) {
    return NextResponse.json<ApiError>(
      { error: "Not authenticated." },
      { status: 401 }
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json<ApiError>(
      { error: "Supabase server client env vars are missing." },
      { status: 500 }
    )
  }

  const userScopedClient =
    bearerToken && !sessionUser
      ? createClient(url, anonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          },
        })
      : serverClient

  const { data: profile, error: profileError } = await userScopedClient
    .from("users")
    .select("id, organization_id, role, status")
    .eq("id", actingUser.id)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json<ApiError>(
      { error: "Account not found." },
      { status: 400 }
    )
  }

  if (profile.status !== "active") {
    return NextResponse.json<ApiError>(
      { error: "Account is not active." },
      { status: 403 }
    )
  }

  if (!profile.organization_id) {
    return NextResponse.json<ApiError>(
      { error: "Account not configured." },
      { status: 400 }
    )
  }

  return {
    supabase: userScopedClient,
    authUser: actingUser,
    profile: profile as ChatProfile,
  }
}
