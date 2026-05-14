import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import {
  countSavedCustomAudiencesForUser,
  createSavedCustomAudience,
  listSavedCustomAudiences,
  MAX_SAVED_CUSTOM_AUDIENCES_PER_USER,
} from "@/lib/supabase/custom-audiences"

const childSegmentSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(300),
  colorToken: z.string().trim().min(1).max(64).nullable().optional(),
})

const saveCustomAudienceSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  filters_summary: z.string().trim().max(2000).nullable().optional(),
  base_size: z.number().int().min(0).nullable().optional(),
  avg_concern: z.number().min(0).max(10).nullable().optional(),
  snapshot: z.object({
    filters: z.record(z.string(), z.unknown()),
    childSegments: z.array(childSegmentSchema),
  }),
})

export async function GET(request: Request) {
  const session = await requireChatSession(request)
  if (session instanceof NextResponse) return session

  const { supabase } = session
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("project_id")

  if (!projectId) {
    return NextResponse.json<ApiError>(
      { error: "project_id is required." },
      { status: 400 }
    )
  }

  const parsedProjectId = z.string().uuid().safeParse(projectId)
  if (!parsedProjectId.success) {
    return NextResponse.json<ApiError>(
      { error: "Invalid project_id." },
      { status: 400 }
    )
  }

  try {
    const audiences = await listSavedCustomAudiences(supabase, parsedProjectId.data)
    return NextResponse.json({ audiences })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load saved audiences."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = saveCustomAudienceSchema.safeParse(await request.json())
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
    .select("id, organization_id")
    .eq("id", body.project_id)
    .maybeSingle()

  if (projectError || !project) {
    return NextResponse.json<ApiError>(
      { error: "Project not found." },
      { status: 404 }
    )
  }

  try {
    const existingCount = await countSavedCustomAudiencesForUser(
      supabase,
      body.project_id,
      profile.id
    )
    if (existingCount >= MAX_SAVED_CUSTOM_AUDIENCES_PER_USER) {
      return NextResponse.json<ApiError>(
        {
          error: `You can save up to ${MAX_SAVED_CUSTOM_AUDIENCES_PER_USER} custom audiences for this project. Delete one to add another.`,
        },
        { status: 409 }
      )
    }

    const audience = await createSavedCustomAudience(supabase, {
      projectId: body.project_id,
      organizationId: String(project.organization_id),
      createdBy: profile.id,
      name: body.name,
      filtersSummary: body.filters_summary ?? null,
      baseSize: body.base_size ?? null,
      avgConcern: body.avg_concern ?? null,
      snapshot: body.snapshot,
    })

    return NextResponse.json(audience, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save custom audience."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
