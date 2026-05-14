import { NextResponse } from "next/server"
import { createClient, type User as AuthUser } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export type ApiError = {
  error: string
}

function forbidden() {
  return NextResponse.json<ApiError>({ error: "Forbidden." }, { status: 403 })
}

export type DashboardAdminOk = {
  actingUser: AuthUser
  adminClient: SupabaseClient
}

/**
 * Ensures the request is from an authenticated dashboard admin and returns the service-role client.
 * Matches session + optional Bearer token behavior used by POST /api/admin/users.
 */
export async function requireDashboardAdmin(
  request: Request
): Promise<DashboardAdminOk | NextResponse<ApiError>> {
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null

  let serverClient
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
    return forbidden()
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

  const { data: adminRow, error: adminLookupError } = await userScopedClient
    .from("users")
    .select("id,role")
    .eq("id", actingUser.id)
    .maybeSingle()

  if (adminLookupError || adminRow?.role !== "admin") {
    return forbidden()
  }

  try {
    const adminClient = getSupabaseAdminClient()
    return { actingUser, adminClient }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
