import { NextResponse } from "next/server"
import {
  approveDemoAccessRequest,
  approveResultMessage,
} from "@/lib/demo-access/provision"
import { demoHtmlError, demoHtmlSuccess } from "@/lib/demo-access/html-pages"
import { verifyDemoApprovalToken } from "@/lib/demo-access/tokens"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim()
  if (!token) {
    return new NextResponse(demoHtmlError("Missing approval token."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  const verified = verifyDemoApprovalToken(token, "approve")
  if (!verified.ok) {
    return new NextResponse(demoHtmlError(verified.reason), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  let adminClient
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return new NextResponse(demoHtmlError(message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  const result = await approveDemoAccessRequest(
    adminClient,
    verified.payload.requestId
  )
  const { title, message, isError } = approveResultMessage(result)
  const html = isError
    ? demoHtmlError(message)
    : demoHtmlSuccess(title, message)

  return new NextResponse(html, {
    status: isError ? 400 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
