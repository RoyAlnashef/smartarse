import { NextResponse } from "next/server"
import { z } from "zod"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"

const createUserSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    name: z.string().trim().min(1, "Name is required.").max(120),
    role: z.enum(["admin", "client", "user"]),
    organizationId: z.string().uuid(),
  })

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

  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { adminClient } = authResult

  const { data: createdUser, error: createAuthError } =
    await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.name,
        // Mirror for DB triggers that only read raw_user_meta_data (some setups).
        admin_provisioned: true,
      },
      app_metadata: {
        admin_provisioned: true,
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
