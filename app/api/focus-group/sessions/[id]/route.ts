import { NextResponse } from "next/server"
import { z } from "zod"
import type { ApiError } from "@/lib/api/require-dashboard-admin"
import { requireChatSession } from "@/lib/api/require-chat-session"
import { resultPayloadToClientShape } from "@/lib/api/chat-payload"
import type { FocusGroupSessionRow } from "@/app/api/focus-group/sessions/route"

const idSchema = z.string().uuid()

const PLACEHOLDER_FALLBACK = "I wasn't able to respond to this round."

type ChatRow = {
  request_id: string
  user_query: string
  created_at: string
  status: string
  result_payload: unknown
  focus_group_round_number: number | null
  focus_group_participant_index: number | null
}

type ParticipantSnapshot = {
  persona_id: string
  segment_code: string
  title: string
  color_token: string
  country?: string | null
}

type RoundResponseDto = {
  participant_index: number
  participant_label: string
  participant_color_token: string
  request_id: string
  content: string
  timestamp: string
  is_placeholder: boolean
}

type RoundDto = {
  round_number: number
  topic: string
  round_request_id: string
  created_at: string
  responses: RoundResponseDto[]
}

/**
 * Parses the JSON `participants` blob on a session row into a stable shape.
 * Tolerates the column being a string (some Supabase drivers return jsonb as text).
 */
function parseParticipants(raw: unknown): ParticipantSnapshot[] {
  let value: unknown = raw
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      value = []
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .map((entry): ParticipantSnapshot | null => {
      if (!entry || typeof entry !== "object") return null
      const obj = entry as Record<string, unknown>
      const personaId = typeof obj.persona_id === "string" ? obj.persona_id : null
      const segmentCode =
        typeof obj.segment_code === "string" ? obj.segment_code : null
      const title = typeof obj.title === "string" ? obj.title : null
      const colorToken =
        typeof obj.color_token === "string" ? obj.color_token : null
      if (!personaId || !segmentCode || !title || !colorToken) return null
      const country =
        typeof obj.country === "string" ? obj.country : null
      return {
        persona_id: personaId,
        segment_code: segmentCode,
        title,
        color_token: colorToken,
        country,
      }
    })
    .filter((p): p is ParticipantSnapshot => p !== null)
}

export async function GET(
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

  const { data: row, error: sessionError } = await supabase
    .from("focus_group_sessions")
    .select("*")
    .eq("id", parsedId.data)
    .maybeSingle<FocusGroupSessionRow>()

  if (sessionError) {
    return NextResponse.json<ApiError>(
      { error: sessionError.message ?? "Failed to load focus group session." },
      { status: 500 }
    )
  }

  if (!row) {
    return NextResponse.json<ApiError>(
      { error: "Focus group session not found." },
      { status: 404 }
    )
  }

  const { data: rawRows, error: rowsError } = await supabase
    .from("chat_results")
    .select(
      "request_id, user_query, created_at, status, result_payload, focus_group_round_number, focus_group_participant_index"
    )
    .eq("focus_group_session_id", parsedId.data)
    .in("status", ["complete", "error_fallback"])
    .order("focus_group_round_number", { ascending: true })
    .order("focus_group_participant_index", { ascending: true })

  if (rowsError) {
    return NextResponse.json<ApiError>(
      { error: rowsError.message ?? "Failed to load focus group rounds." },
      { status: 500 }
    )
  }

  const participants = parseParticipants(row.participants)

  const roundsMap = new Map<number, RoundDto>()
  for (const r of (rawRows ?? []) as ChatRow[]) {
    const roundNumber = r.focus_group_round_number
    const participantIndex = r.focus_group_participant_index
    if (roundNumber == null || participantIndex == null) continue

    const participant = participants[participantIndex]
    const participantLabel = participant?.title ?? `Participant ${participantIndex + 1}`
    const participantColorToken = participant?.color_token ?? "grey-300"

    const isPlaceholder = r.status === "error_fallback"
    const shaped = resultPayloadToClientShape(r.result_payload)
    const content = shaped.answer?.trim() || PLACEHOLDER_FALLBACK

    const existingRound = roundsMap.get(roundNumber)
    const response: RoundResponseDto = {
      participant_index: participantIndex,
      participant_label: participantLabel,
      participant_color_token: participantColorToken,
      request_id: r.request_id,
      content,
      timestamp: r.created_at,
      is_placeholder: isPlaceholder,
    }

    if (!existingRound) {
      roundsMap.set(roundNumber, {
        round_number: roundNumber,
        topic: r.user_query,
        // The legacy `round_request_id` is internal to credit charging; this
        // endpoint returns a stable per-round identifier built from the session
        // id + round number so the client can use it as a React key.
        round_request_id: `${parsedId.data}-r${roundNumber}`,
        created_at: r.created_at,
        responses: [response],
      })
    } else {
      existingRound.responses.push(response)
      if (r.created_at < existingRound.created_at) {
        existingRound.created_at = r.created_at
      }
    }
  }

  const rounds = Array.from(roundsMap.values()).sort(
    (a, b) => a.round_number - b.round_number
  )

  return NextResponse.json({
    session: row,
    participants,
    rounds,
  })
}
