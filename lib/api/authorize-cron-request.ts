import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"

export function authorizeCronRequest(
  request: Request,
): NextResponse<ApiError> | null {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) {
    return NextResponse.json<ApiError>(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    )
  }

  const auth = request.headers.get("authorization")
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length).trim()
    : ""
  if (!token || token !== expected) {
    return NextResponse.json<ApiError>({ error: "Unauthorized." }, { status: 401 })
  }

  return null
}
