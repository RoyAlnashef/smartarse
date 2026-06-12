"use client"

import { useCallback, useRef, useState } from "react"
import { N8N_WEBHOOK_PROXY_PATH } from "@/lib/n8n-webhook-url"
import { buildFocusGroupParticipantBrief } from "@/lib/persona-webhook-brief"
import {
  isProjectLiveForChat,
  projectNotLiveChatMessage,
} from "@/lib/project-status"
import { useSupportContactEmail } from "@/lib/support-contact-context"
import { sanitiseQuery } from "@/lib/sanitise"
import { resultPayloadToClientShape } from "@/lib/api/chat-payload"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import type {
  FocusGroupParticipant,
  FocusGroupResponse,
  FocusGroupRound,
  FocusGroupSession,
  Project,
} from "@/lib/types"
import type { ChatQuestionWebhookPayload } from "@/hooks/useChatQuestion"

const PARTICIPANT_TIMEOUT_MS = 90_000
const POLL_MAX_ATTEMPTS = 60
const PLACEHOLDER_FALLBACK = "I wasn't able to respond to this round."

export type FocusGroupRoundError =
  | { kind: "insufficient_credits"; message: string; balance: number | null }
  | { kind: "project_not_live"; message: string }
  | { kind: "not_signed_in"; message: string }
  | { kind: "session_invalid"; message: string }
  | { kind: "round_failed"; message: string }

export class FocusGroupRoundException extends Error {
  readonly detail: FocusGroupRoundError
  constructor(detail: FocusGroupRoundError) {
    super(detail.message)
    this.name = "FocusGroupRoundException"
    this.detail = detail
  }
}

type ExecuteRoundArgs = {
  session: FocusGroupSession
  /** Lookup of personaId -> baseline mock used by the brief composer. */
  personasById: Readonly<Record<string, PersonaMock>>
  topic: string
  roundNumber: number
  priorRounds: readonly FocusGroupRound[]
  studyLabel?: string | null
  onParticipantStart?: (participantIndex: number) => void
  onParticipantResponse?: (response: FocusGroupResponse) => void
}

type N8nAnswer = { answer?: unknown } & Record<string, unknown>

function extractAnswerText(data: unknown): string | null {
  if (typeof data === "string") return data.trim() || null
  if (!data) return null
  const obj = Array.isArray(data) ? data[0] : data
  if (!obj || typeof obj !== "object") return null
  const raw = (obj as N8nAnswer).answer
  if (typeof raw === "string") return raw.trim() || null

  const shape = resultPayloadToClientShape(data)
  return shape.answer?.trim() || null
}

async function pollForParticipantAnswer(
  requestId: string
): Promise<string | null> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const wait = i < 8 ? 3_000 : i < 24 ? 5_000 : 8_000
    await new Promise((r) => setTimeout(r, wait))

    const res = await fetch(
      `/api/chat/poll?request_id=${encodeURIComponent(requestId)}`
    )

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5", 10)
      await new Promise((r) => setTimeout(r, retryAfter * 1_000))
      continue
    }

    if (res.status === 200) {
      const data = (await res.json()) as {
        status?: string
        result?: unknown
      }
      if (
        data.status === "complete" ||
        data.status === "error_fallback"
      ) {
        return extractAnswerText(data.result)
      }
    }
  }
  return null
}

async function postChargeRound(args: {
  projectId: string
  sessionId: string
  roundRequestId: string
  participantCount: number
}): Promise<{
  ok: true
  charged: number
  balance: number
  idempotent: boolean
} | { ok: false; status: number; balance: number | null; error: string }> {
  const res = await fetch("/api/credits/charge-focus-group-round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: args.projectId,
      session_id: args.sessionId,
      round_request_id: args.roundRequestId,
      participant_count: args.participantCount,
    }),
  })

  const payload = (await res.json().catch(() => ({}))) as
    | {
        success: true
        charged_amount: number
        credit_balance: number
        idempotent: boolean
      }
    | { success: false; error: string; credit_balance?: number | null }
    | { error?: string }

  if (res.ok && "success" in payload && payload.success) {
    return {
      ok: true,
      charged: payload.charged_amount,
      balance: payload.credit_balance,
      idempotent: payload.idempotent,
    }
  }

  const balance =
    "credit_balance" in payload && typeof payload.credit_balance === "number"
      ? payload.credit_balance
      : null
  const error =
    "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "Failed to charge focus-group round."
  return { ok: false, status: res.status, balance, error }
}

async function postParticipantPersist(args: {
  request_id: string
  project_id: string
  user_query: string
  status: "complete" | "error_fallback" | "pending"
  result: Record<string, unknown>
  focus_group_session_id: string
  focus_group_round_number: number
  focus_group_participant_index: number
}): Promise<void> {
  try {
    await fetch("/api/chat/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...args,
        chat_context_mode: "focus_group",
      }),
    })
  } catch {
    /* non-blocking — the UI already has the response */
  }
}

export function useFocusGroupRound({
  orgId,
  userId,
  projectId,
  projectStatus,
  orgSettings,
}: {
  orgId: string
  userId: string
  projectId: string
  projectStatus: Project["status"]
  orgSettings: {
    weighted: boolean
    data_source_mode: string
  }
}) {
  const supportEmail = useSupportContactEmail()
  const [loading, setLoading] = useState(false)
  const [activeParticipantIndex, setActiveParticipantIndex] = useState<
    number | null
  >(null)
  const [error, setError] = useState<FocusGroupRoundError | null>(null)
  const inflightRef = useRef<string | null>(null)

  const executeRound = useCallback(
    async ({
      session,
      personasById,
      topic,
      roundNumber,
      priorRounds,
      studyLabel,
      onParticipantStart,
      onParticipantResponse,
    }: ExecuteRoundArgs): Promise<FocusGroupRound> => {
      if (!userId) {
        const detail: FocusGroupRoundError = {
          kind: "not_signed_in",
          message: "You must be signed in to run a focus group.",
        }
        setError(detail)
        throw new FocusGroupRoundException(detail)
      }

      if (!isProjectLiveForChat(projectStatus)) {
        const detail: FocusGroupRoundError = {
          kind: "project_not_live",
          message: projectNotLiveChatMessage(supportEmail),
        }
        setError(detail)
        throw new FocusGroupRoundException(detail)
      }

      if (session.participants.length < 2 || session.participants.length > 4) {
        const detail: FocusGroupRoundError = {
          kind: "session_invalid",
          message:
            "A focus group needs 2-4 participants. Please update participants and try again.",
        }
        setError(detail)
        throw new FocusGroupRoundException(detail)
      }

      const trimmedTopic = sanitiseQuery(topic)
      if (!trimmedTopic) {
        const detail: FocusGroupRoundError = {
          kind: "session_invalid",
          message: "A discussion topic is required to run a round.",
        }
        setError(detail)
        throw new FocusGroupRoundException(detail)
      }

      const roundRequestId = crypto.randomUUID()
      inflightRef.current = roundRequestId
      setLoading(true)
      setActiveParticipantIndex(null)
      setError(null)

      try {
        // Step 1: atomic credit pre-charge for the entire round.
        const charge = await postChargeRound({
          projectId,
          sessionId: session.id,
          roundRequestId,
          participantCount: session.participants.length,
        })

        if (!charge.ok) {
          const detail: FocusGroupRoundError =
            charge.status === 402
              ? {
                  kind: "insufficient_credits",
                  message: charge.error,
                  balance: charge.balance,
                }
              : { kind: "round_failed", message: charge.error }
          setError(detail)
          throw new FocusGroupRoundException(detail)
        }

        const completedResponses: FocusGroupResponse[] = []
        const roundCreatedAt = new Date().toISOString()

        for (let i = 0; i < session.participants.length; i++) {
          const participant = session.participants[i]
          const persona = personasById[participant.personaId]
          if (!persona) {
            const detail: FocusGroupRoundError = {
              kind: "session_invalid",
              message: `Persona "${participant.personaId}" is no longer available in this project.`,
            }
            setError(detail)
            throw new FocusGroupRoundException(detail)
          }

          setActiveParticipantIndex(i)
          onParticipantStart?.(i)

          const requestId = crypto.randomUUID()
          const { brief, concern } = buildFocusGroupParticipantBrief(persona, {
            priorRounds,
            thisRoundResponsesSoFar: completedResponses,
            country: session.countryContext,
            studyLabel,
          })

          const chatInput =
            `FOCUS GROUP DISCUSSION — Round ${roundNumber}\n` +
            `Topic: "${trimmedTopic}"\n` +
            `Country context: ${session.countryContext.toUpperCase()}\n\n` +
            `Respond to this topic from your segment's perspective. ` +
            `Be concise (150-250 words). React to what other participants said if applicable. ` +
            `Be conversational and opinionated.`

          const payload: ChatQuestionWebhookPayload = {
            chatInput,
            org_id: orgId,
            user_id: userId,
            request_id: requestId,
            sessionId: `focus-group-${session.id}`,
            project_id: projectId,
            weighted: orgSettings.weighted,
            data_source_mode: orgSettings.data_source_mode,
            qual_enabled: true,
            persona_mode: true,
            persona_brief: brief,
            persona_brief_concern: concern,
          }

          // Seed pending row so a late n8n callback can reconcile.
          void postParticipantPersist({
            request_id: requestId,
            project_id: projectId,
            user_query: trimmedTopic,
            status: "pending",
            result: {},
            focus_group_session_id: session.id,
            focus_group_round_number: roundNumber,
            focus_group_participant_index: i,
          })

          let answerText: string | null = null
          let isPlaceholder = false
          let rawResultForPersist: Record<string, unknown> = {}

          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(
              () => controller.abort(),
              PARTICIPANT_TIMEOUT_MS
            )
            try {
              const webhookRes = await fetch(N8N_WEBHOOK_PROXY_PATH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
              })
              clearTimeout(timeoutId)
              if (webhookRes.status === 202) {
                answerText = await pollForParticipantAnswer(requestId)
                if (answerText) {
                  rawResultForPersist = { answer: answerText }
                }
              } else if (webhookRes.ok) {
                const data: unknown = await webhookRes.json()
                answerText = extractAnswerText(data)
                if (
                  data !== null &&
                  typeof data === "object" &&
                  !Array.isArray(data)
                ) {
                  rawResultForPersist = data as Record<string, unknown>
                } else if (
                  Array.isArray(data) &&
                  data[0] !== null &&
                  typeof data[0] === "object"
                ) {
                  rawResultForPersist = data[0] as Record<string, unknown>
                } else if (answerText) {
                  rawResultForPersist = { answer: answerText }
                }
              }
            } catch (err) {
              clearTimeout(timeoutId)
              if ((err as Error).name === "AbortError") {
                answerText = await pollForParticipantAnswer(requestId)
                if (answerText) {
                  rawResultForPersist = { answer: answerText }
                }
              } else {
                throw err
              }
            }
          } catch {
            answerText = null
          }

          if (!answerText) {
            answerText = PLACEHOLDER_FALLBACK
            isPlaceholder = true
            rawResultForPersist = { answer: answerText }
          }

          const response: FocusGroupResponse = {
            participantIndex: i,
            participantLabel: participant.label,
            participantColorToken: participant.colorToken,
            requestId,
            content: answerText,
            timestamp: new Date().toISOString(),
            ...(isPlaceholder ? { isPlaceholder: true } : {}),
          }

          completedResponses.push(response)
          onParticipantResponse?.(response)

          void postParticipantPersist({
            request_id: requestId,
            project_id: projectId,
            user_query: trimmedTopic,
            status: isPlaceholder ? "error_fallback" : "complete",
            result: rawResultForPersist,
            focus_group_session_id: session.id,
            focus_group_round_number: roundNumber,
            focus_group_participant_index: i,
          })
        }

        const round: FocusGroupRound = {
          roundNumber,
          topic: trimmedTopic,
          roundRequestId,
          responses: completedResponses,
          createdAt: roundCreatedAt,
        }
        return round
      } finally {
        if (inflightRef.current === roundRequestId) {
          inflightRef.current = null
        }
        setActiveParticipantIndex(null)
        setLoading(false)
      }
    },
    [orgId, userId, projectId, projectStatus, orgSettings.weighted, orgSettings.data_source_mode, supportEmail]
  )

  return {
    executeRound,
    loading,
    activeParticipantIndex,
    error,
    clearError: () => setError(null),
  }
}

export type UseFocusGroupRoundReturn = ReturnType<typeof useFocusGroupRound>

/** Convenience helper for callers that need to build a participant snapshot from a PersonaMock. */
export function participantFromPersona(
  persona: PersonaMock,
  options?: { country?: FocusGroupParticipant["country"] }
): FocusGroupParticipant {
  return {
    personaId: persona.id,
    segmentCode: persona.segmentCode,
    label: persona.title,
    colorToken: persona.colorCiteToken,
    country: options?.country ?? null,
  }
}
