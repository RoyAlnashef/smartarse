import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const createUserSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    name: z.string().trim().min(1, "Name is required.").max(120),
    role: z.enum(["admin", "client", "user"]),
    organizationId: z.string().uuid(),
  })

type ApiError = {
  error: string
}

function forbidden() {
  return NextResponse.json<ApiError>({ error: "Forbidden." }, { status: 403 })
}

export async function POST(request: Request) {
  const bodyResult = createUserSchema.safeParse(await request.json())
  if (!bodyResult.success) {
    const firstIssue = bodyResult.error.issues[0]
    return NextResponse.json<ApiError>(
      { error: firstIssue?.message ?? "Invalid request body." },
      { status: 400 }
    )
  }

  const payload = bodyResult.data
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

  let actingUser = sessionUser
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

  let adminClient
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const { data: createdUser, error: createAuthError } =
    await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.name,
      },
    })

  if (createAuthError || !createdUser.user) {
    return NextResponse.json<ApiError>(
      { error: createAuthError?.message ?? "Failed to create auth user." },
      { status: 400 }
    )
  }

  const newUserId = createdUser.user.id

  const { error: upsertError } = await adminClient.from("users").upsert(
    {
      id: newUserId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      organization_id: payload.organizationId,
      status: "active",
    },
    { onConflict: "id" }
  )

  if (upsertError) {
    await adminClient.auth.admin.deleteUser(newUserId)
    return NextResponse.json<ApiError>(
      { error: upsertError.message ?? "Failed to create user profile row." },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      id: newUserId,
      email: payload.email,
    },
    { status: 201 }
  )
}
