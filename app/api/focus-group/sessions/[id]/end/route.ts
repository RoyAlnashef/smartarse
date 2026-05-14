import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import type { FocusGroupSessionRow } from "@/app/api/focus-group/sessions/route"

const idSchema = z.string().uuid()

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params
  const parsedId = idSchema.safeParse(rawId)
  if (!parsedId.success) {
    return NextResponse.json<ApiError>(
      { error: "Invalid focus group session id." },
      { status: 400 }
    )
  }

  const session = await requireChatSession(request)
  if (session instanceof NextResponse) return session

  const { supabase } = session

  const { data, error } = await supabase
    .from("focus_group_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .is("ended_at", null)
    .select("*")
    .maybeSingle<FocusGroupSessionRow>()

  if (error) {
    return NextResponse.json<ApiError>(
      { error: error.message ?? "Failed to end focus group session." },
      { status: 500 }
    )
  }

  if (!data) {
    // Either the row doesn't exist, was already ended, or RLS denied access.
    return NextResponse.json<ApiError>(
      { error: "Focus group session not found or already ended." },
      { status: 404 }
    )
  }

  return NextResponse.json({ session: data }, { status: 200 })
}
