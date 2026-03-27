import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import {
  resultPayloadToClientShape,
  type ChatResultForClient,
} from "@/lib/api/chat-payload"

type PollOkBody = {
  status: "complete" | "error_fallback"
  result: ChatResultForClient
}

export async function GET(request: Request) {
  const session = await requireChatSession(request)
  if (session instanceof NextResponse) {
    return session
  }

  const { supabase, profile } = session
  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get("request_id")

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!requestId || !uuidRe.test(requestId)) {
    return NextResponse.json<ApiError>(
      { error: "Invalid or missing request_id." },
      { status: 400 }
    )
  }

  const { data: row, error } = await supabase
    .from("chat_results")
    .select("status, result_payload, user_id")
    .eq("request_id", requestId)
    .maybeSingle()

  if (error) {
    return NextResponse.json<ApiError>(
      { error: error.message ?? "Poll failed." },
      { status: 500 }
    )
  }

  if (!row || row.user_id !== profile.id) {
    return new NextResponse(null, { status: 202 })
  }

  const status = row.status as string
  if (status === "pending" || status === "processing") {
    return new NextResponse(null, { status: 202 })
  }

  if (status === "complete" || status === "error_fallback") {
    const body: PollOkBody = {
      status: status as PollOkBody["status"],
      result: resultPayloadToClientShape(row.result_payload),
    }
    return NextResponse.json(body)
  }

  return new NextResponse(null, { status: 202 })
}
