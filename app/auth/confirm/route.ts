import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { safeNextPath } from "@/lib/auth/safe-next-path"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler"

function redirectWithAuthError(request: NextRequest, next: string) {
  const errorPath = safeNextPath(next, "/auth/reset-password")
  const errorUrl = new URL(errorPath, request.url)
  errorUrl.searchParams.set("error", "invalid_link")
  return NextResponse.redirect(errorUrl)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"), "/auth/reset-password")

  const successUrl = new URL(next, request.url)
  let response = NextResponse.redirect(successUrl)

  const supabase = createSupabaseRouteHandlerClient(request, response)
  if (!supabase) {
    return redirectWithAuthError(request, next)
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return response
    }
    return redirectWithAuthError(request, next)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    return redirectWithAuthError(request, next)
  }

  return redirectWithAuthError(request, next)
}
