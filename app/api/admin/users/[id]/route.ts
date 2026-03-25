import { NextResponse } from "next/server"
import { z } from "zod"
import {
  requireDashboardAdmin,
  type ApiError,
} from "@/lib/api/require-dashboard-admin"

const uuidSchema = z.string().uuid()

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const idResult = uuidSchema.safeParse(id)
  if (!idResult.success) {
    return NextResponse.json<ApiError>(
      { error: "Invalid user id." },
      { status: 400 }
    )
  }

  const authResult = await requireDashboardAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { actingUser, adminClient } = authResult

  if (actingUser.id === id) {
    return NextResponse.json<ApiError>(
      { error: "You cannot delete your own account." },
      { status: 400 }
    )
  }

  const { data: targetRow, error: targetError } = await adminClient
    .from("users")
    .select("role")
    .eq("id", id)
    .maybeSingle()

  if (targetError) {
    return NextResponse.json<ApiError>(
      { error: targetError.message },
      { status: 400 }
    )
  }

  if (targetRow?.role === "admin") {
    const { count, error: countError } = await adminClient
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .neq("id", id)

    if (countError) {
      return NextResponse.json<ApiError>(
        { error: countError.message },
        { status: 400 }
      )
    }

    if ((count ?? 0) === 0) {
      return NextResponse.json<ApiError>(
        { error: "Cannot delete the last dashboard admin." },
        { status: 400 }
      )
    }
  }

  if (targetRow) {
    const { error: deleteProfileError } = await adminClient
      .from("users")
      .delete()
      .eq("id", id)

    if (deleteProfileError) {
      return NextResponse.json<ApiError>(
        { error: deleteProfileError.message },
        { status: 400 }
      )
    }
  }

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id)

  if (deleteAuthError) {
    if (!targetRow) {
      return NextResponse.json<ApiError>(
        { error: deleteAuthError.message ?? "User not found." },
        { status: 404 }
      )
    }
    return NextResponse.json<ApiError>(
      {
        error:
          deleteAuthError.message ??
          "Profile was removed but the auth user could not be deleted.",
      },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
