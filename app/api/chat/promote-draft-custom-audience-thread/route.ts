import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import { getSavedCustomAudienceById } from "@/lib/supabase/custom-audiences"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  project_id: z.string().uuid(),
  anchor_request_id: z.string().uuid(),
  saved_audience_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json<ApiError>(
      { error: first?.message ?? "Invalid request body." },
      { status: 400 }
    )
  }

  const session = await requireChatSession(request)
  if (session instanceof NextResponse) return session

  const { supabase, profile } = session
  const { project_id, anchor_request_id, saved_audience_id } = parsed.data

  let admin
  try {
    admin = getSupabaseAdminClient()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server configuration error."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .maybeSingle()

  if (projectError || !project) {
    return NextResponse.json<ApiError>(
      { error: "Project not found." },
      { status: 404 }
    )
  }

  const { data: anchor, error: anchorError } = await admin
    .from("chat_results")
    .select(
      "user_id, project_id, chat_context_mode, show_in_chat_history, custom_audience_id"
    )
    .eq("request_id", anchor_request_id)
    .maybeSingle()

  if (anchorError || !anchor) {
    return NextResponse.json<ApiError>(
      { error: "Thread not found." },
      { status: 404 }
    )
  }

  if (anchor.user_id !== profile.id || anchor.project_id !== project_id) {
    return NextResponse.json<ApiError>({ error: "Forbidden." }, { status: 403 })
  }

  if (anchor.chat_context_mode !== "custom_audience") {
    return NextResponse.json<ApiError>(
      { error: "Thread is not a custom audience chat." },
      { status: 400 }
    )
  }

  if (
    anchor.show_in_chat_history === true &&
    anchor.custom_audience_id === saved_audience_id
  ) {
    return NextResponse.json({ ok: true, already: true })
  }

  if (anchor.show_in_chat_history !== false) {
    return NextResponse.json<ApiError>(
      { error: "Thread is not eligible for promotion." },
      { status: 400 }
    )
  }

  const saved = await getSavedCustomAudienceById(admin, saved_audience_id)
  if (!saved || saved.projectId !== project_id) {
    return NextResponse.json<ApiError>(
      { error: "Saved audience not found for this project." },
      { status: 404 }
    )
  }

  const segments = saved.snapshot.childSegments
  const childIds = segments.map((s) => s.id)
  const childNames = segments.map((s) => s.name)
  const colorTokens =
    saved.childSegmentColorTokens.length > 0
      ? saved.childSegmentColorTokens
      : segments.map((s) => s.colorToken).filter((t): t is string => Boolean(t))

  const { error: updateError } = await admin
    .from("chat_results")
    .update({
      custom_audience_id: saved.id,
      custom_audience_name: saved.name,
      custom_audience_child_segment_ids: childIds.length > 0 ? childIds : null,
      custom_audience_child_segment_names: childNames.length > 0 ? childNames : null,
      custom_audience_child_segment_color_tokens:
        colorTokens.length > 0 ? colorTokens : null,
      show_in_chat_history: true,
    })
    .eq("request_id", anchor_request_id)
    .eq("user_id", profile.id)

  if (updateError) {
    return NextResponse.json<ApiError>(
      { error: updateError.message ?? "Failed to promote thread." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
