import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { secretsMatch } from "@/lib/api/compare-secrets"

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
  if (!secretsMatch(token, expected)) {
    return NextResponse.json<ApiError>({ error: "Unauthorized." }, { status: 401 })
  }

  return null
}
