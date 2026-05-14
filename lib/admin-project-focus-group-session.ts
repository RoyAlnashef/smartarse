import type { FocusGroupSessionRow } from "@/app/api/focus-group/sessions/route"

export type AdminFocusGroupParticipant = {
  persona_id: string
  segment_code: string
  title: string
  color_token: string
  country?: string | null
}

export type AdminFocusGroupRoundResponse = {
  participant_index: number
  participant_label: string
  participant_color_token: string
  request_id: string
  content: string
  timestamp: string
  is_placeholder: boolean
}

export type AdminFocusGroupRound = {
  round_number: number
  topic: string
  round_request_id: string
  created_at: string
  responses: AdminFocusGroupRoundResponse[]
}

export type AdminFocusGroupSessionPayload = {
  session: FocusGroupSessionRow
  participants: AdminFocusGroupParticipant[]
  rounds: AdminFocusGroupRound[]
}

export async function getAdminProjectFocusGroupSession(
  projectId: string,
  sessionId: string
): Promise<AdminFocusGroupSessionPayload> {
  const params = new URLSearchParams({ session_id: sessionId })
  const res = await fetch(
    `/api/admin/projects/${projectId}/focus-group-session?${params.toString()}`
  )
  if (res.status === 403) throw new Error("Forbidden")
  if (res.status === 404) throw new Error("Focus group session not found")
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(
      body?.error?.trim() || "Failed to load admin focus group session"
    )
  }
  return res.json() as Promise<AdminFocusGroupSessionPayload>
}
