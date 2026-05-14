import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import {
  deleteSavedCustomAudience,
  getSavedCustomAudienceById,
  updateSavedCustomAudience,
} from "@/lib/supabase/custom-audiences"

const updateCustomAudienceSchema = z.object({
  name: z.string().trim().min(1).max(300),
  filters_summary: z.string().trim().max(2000).nullable().optional(),
  base_size: z.number().int().min(0).nullable().optional(),
  avg_concern: z.number().min(0).max(10).nullable().optional(),
  snapshot: z.object({
    filters: z.record(z.string(), z.unknown()),
    childSegments: z.array(
      z.object({
        id: z.string().trim().min(1).max(120),
        name: z.string().trim().min(1).max(300),
        colorToken: z.string().trim().min(1).max(64).nullable().optional(),
      })
    ),
  }),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const session = await requireChatSession(request)
  if (session instanceof NextResponse) return session

  const { id } = await context.params
  const parsedId = z.string().uuid().safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json<ApiError>({ error: "Invalid id." }, { status: 400 })
  }

  try {
    const audience = await getSavedCustomAudienceById(session.supabase, parsedId.data)
    if (!audience) {
      return NextResponse.json<ApiError>(
        { error: "Saved audience not found." },
        { status: 404 }
      )
    }
    return NextResponse.json(audience)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load saved audience."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const parsed = updateCustomAudienceSchema.safeParse(await request.json())
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json<ApiError>(
      { error: first?.message ?? "Invalid request body." },
      { status: 400 }
    )
  }

  const session = await requireChatSession(request)
  if (session instanceof NextResponse) return session

  const { id } = await context.params
  const parsedId = z.string().uuid().safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json<ApiError>({ error: "Invalid id." }, { status: 400 })
  }

  try {
    const audience = await updateSavedCustomAudience(session.supabase, parsedId.data, {
      name: parsed.data.name,
      filtersSummary: parsed.data.filters_summary ?? null,
      baseSize: parsed.data.base_size ?? null,
      avgConcern: parsed.data.avg_concern ?? null,
      snapshot: parsed.data.snapshot,
    })

    return NextResponse.json(audience)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update saved audience."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireChatSession(_request)
  if (session instanceof NextResponse) return session

  const { id } = await context.params
  const parsedId = z.string().uuid().safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json<ApiError>({ error: "Invalid id." }, { status: 400 })
  }

  try {
    const deleted = await deleteSavedCustomAudience(session.supabase, parsedId.data)
    if (!deleted) {
      return NextResponse.json<ApiError>(
        { error: "Saved audience not found." },
        { status: 404 }
      )
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete saved audience."
    return NextResponse.json<ApiError>({ error: message }, { status: 500 })
  }
}
