import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"

const chargeBodySchema = z.object({
  project_id: z.string().uuid(),
  session_id: z.string().uuid(),
  round_request_id: z.string().uuid(),
  participant_count: z.number().int().min(2).max(4),
})

export type ChargeFocusGroupRoundResponse =
  | {
      success: true
      charged_amount: number
      credit_balance: number
      idempotent: boolean
    }
  | {
      success: false
      error: string
      credit_balance?: number | null
    }

export async function POST(request: Request) {
  const parsed = chargeBodySchema.safeParse(await request.json())
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json<ApiError>(
      { error: first?.message ?? "Invalid request body." },
      { status: 400 }
    )
  }

  const session = await requireChatSession(request)
  if (session instanceof NextResponse) return session

  const { supabase } = session
  const body = parsed.data

  // RLS-guarded project lookup so an unauthorized caller can't probe a known
  // project_id; doubles as the existence + access check before the RPC.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, credit_balance")
    .eq("id", body.project_id)
    .maybeSingle()

  if (projectError || !project) {
    return NextResponse.json<ApiError>(
      { error: "Project not found." },
      { status: 404 }
    )
  }

  const { data, error } = await supabase
    .rpc("apply_project_credit_for_focus_group_round", {
      p_round_request_id: body.round_request_id,
      p_session_id: body.session_id,
      p_project_id: body.project_id,
      p_participant_count: body.participant_count,
    })
    .single<{
      charged_amount: number
      credit_balance: number
      idempotent: boolean
    }>()

  if (error) {
    if (error.message?.includes("INSUFFICIENT_CREDITS")) {
      return NextResponse.json<ChargeFocusGroupRoundResponse>(
        {
          success: false,
          error: "Insufficient credits to start this round.",
          credit_balance: (project as { credit_balance: number | null })
            .credit_balance,
        },
        { status: 402 }
      )
    }
    return NextResponse.json<ApiError>(
      { error: error.message ?? "Failed to charge focus-group round." },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json<ApiError>(
      { error: "Charge RPC returned no data." },
      { status: 500 }
    )
  }

  return NextResponse.json<ChargeFocusGroupRoundResponse>(
    {
      success: true,
      charged_amount: data.charged_amount,
      credit_balance: data.credit_balance,
      idempotent: data.idempotent,
    },
    { status: 200 }
  )
}
