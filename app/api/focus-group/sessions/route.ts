import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"

const participantSchema = z.object({
  persona_id: z.string().trim().min(1).max(120),
  segment_code: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(300),
  color_token: z.string().trim().min(1).max(64),
  country: z.string().trim().max(120).nullable().optional(),
})

const createSessionSchema = z.object({
  project_id: z.string().uuid(),
  participants: z.array(participantSchema).min(2).max(4),
  country_context: z.enum(["uk", "ksa", "both"]),
  initial_topic: z.string().trim().min(1).max(300),
})

export type FocusGroupSessionRow = {
  id: string
  project_id: string
  organization_id: string
  created_by: string | null
  participants: unknown
  country_context: "uk" | "ksa" | "both"
  initial_topic: string
  round_count: number
  created_at: string
  updated_at: string
  ended_at: string | null
}

export async function POST(request: Request) {
  const parsed = createSessionSchema.safeParse(await request.json())
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
  const body = parsed.data

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, organization_id, status")
    .eq("id", body.project_id)
    .maybeSingle()

  if (projectError || !project) {
    return NextResponse.json<ApiError>(
      { error: "Project not found." },
      { status: 404 }
    )
  }

  if ((project as { status: string }).status !== "live") {
    return NextResponse.json<ApiError>(
      { error: "Project is not live." },
      { status: 403 }
    )
  }

  const { data: row, error } = await supabase
    .from("focus_group_sessions")
    .insert({
      project_id: body.project_id,
      organization_id: (project as { organization_id: string })
        .organization_id,
      created_by: profile.id,
      participants: body.participants,
      country_context: body.country_context,
      initial_topic: body.initial_topic,
    })
    .select("*")
    .single<FocusGroupSessionRow>()

  if (error || !row) {
    return NextResponse.json<ApiError>(
      { error: error?.message ?? "Failed to create focus group session." },
      { status: 500 }
    )
  }

  return NextResponse.json({ session: row }, { status: 201 })
}
