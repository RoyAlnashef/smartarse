import type { SupabaseClient } from "@supabase/supabase-js"
import {
  mergeJobIntoAnchorPayload,
  type ContextActivationDenorm,
} from "@/lib/chat-thread"
import { segmentColorTokenForDatabase } from "@/lib/theme/cite-color-tokens"

export const CHAT_MERGE_META_KEY = "_arse_merge"
const FALLBACK_DATA_SOURCE_MODE = "both"

type MergeMeta = {
  thread_anchor_request_id?: string
  merge_user_timestamp?: string
  merge_assistant_timestamp?: string
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function pickDenormFromResult(
  result: Record<string, unknown>,
  key: "weighted" | "data_source_mode"
): unknown {
  return result[key]
}

export function extractMergeMeta(payload: unknown): MergeMeta {
  const root = asRecord(payload)
  const meta = asRecord(root[CHAT_MERGE_META_KEY])
  return {
    thread_anchor_request_id:
      typeof meta.thread_anchor_request_id === "string"
        ? meta.thread_anchor_request_id
        : undefined,
    merge_user_timestamp:
      typeof meta.merge_user_timestamp === "string"
        ? meta.merge_user_timestamp
        : undefined,
    merge_assistant_timestamp:
      typeof meta.merge_assistant_timestamp === "string"
        ? meta.merge_assistant_timestamp
        : undefined,
  }
}

export function attachMergeMeta(input: {
  result: Record<string, unknown>
  threadAnchorRequestId?: string
  mergeUserTimestamp?: string
  mergeAssistantTimestamp?: string
}): Record<string, unknown> {
  const {
    result,
    threadAnchorRequestId,
    mergeUserTimestamp,
    mergeAssistantTimestamp,
  } = input
  if (!threadAnchorRequestId) return result

  return {
    ...result,
    [CHAT_MERGE_META_KEY]: {
      thread_anchor_request_id: threadAnchorRequestId,
      ...(mergeUserTimestamp
        ? { merge_user_timestamp: mergeUserTimestamp }
        : {}),
      ...(mergeAssistantTimestamp
        ? { merge_assistant_timestamp: mergeAssistantTimestamp }
        : {}),
    },
  }
}

export async function mergeCompletedJobIntoAnchor(input: {
  admin: SupabaseClient
  actorUserId: string
  organizationId: string
  projectId: string
  anchorRequestId: string
  jobRequestId: string
  followUpUserQuestion: string
  newResult: Record<string, unknown>
  status: "complete" | "error_fallback"
  systemVersion?: string | null
  personaSegmentId?: string | null
  personaSegmentName?: string | null
  personaSegmentColorToken?: string | null
  customAudienceId?: string | null
  customAudienceName?: string | null
  customAudienceChildSegmentIds?: string[] | null
  customAudienceChildSegmentNames?: string[] | null
  customAudienceChildSegmentColorTokens?: (string | null)[] | null
  chatContextMode?: "default" | "persona_segment" | "custom_audience"
  userTimestamp?: string
  assistantTimestamp?: string
  showInChatHistory?: boolean
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { admin } = input
  const { data: anchor, error: anchorError } = await admin
    .from("chat_results")
    .select(
      "user_id, project_id, organization_id, user_query, created_at, result_payload"
    )
    .eq("request_id", input.anchorRequestId)
    .maybeSingle()

  if (anchorError || !anchor) {
    return { ok: false, error: "Thread anchor not found.", status: 404 }
  }

  if (
    anchor.user_id !== input.actorUserId ||
    anchor.project_id !== input.projectId ||
    anchor.organization_id !== input.organizationId
  ) {
    return { ok: false, error: "Forbidden.", status: 403 }
  }

  const anchorPayload = asRecord(anchor.result_payload)
  const nowIso = new Date().toISOString()
  const userTs = input.userTimestamp?.trim() || nowIso
  const asstTs = input.assistantTimestamp?.trim() || nowIso

  const mode = input.chatContextMode ?? "default"
  const contextDenorm: ContextActivationDenorm | null =
    mode === "default"
      ? null
      : {
          chatContextMode: mode,
          personaSegmentId: input.personaSegmentId ?? null,
          customAudienceId: input.customAudienceId ?? null,
          customAudienceName: input.customAudienceName ?? null,
          customAudienceChildSegmentNames:
            input.customAudienceChildSegmentNames ?? null,
          requestIdForActivationId: input.anchorRequestId,
        }

  const mergedPayload = mergeJobIntoAnchorPayload({
    anchorRequestId: input.anchorRequestId,
    anchorPayload,
    anchorUserQuery: anchor.user_query as string,
    anchorCreatedAt: anchor.created_at as string,
    jobRequestId: input.jobRequestId,
    followUpUserQuestion: input.followUpUserQuestion,
    newResult: input.newResult,
    userTimestamp: userTs,
    assistantTimestamp: asstTs,
    contextDenorm,
  })

  const weighted =
    typeof pickDenormFromResult(mergedPayload, "weighted") === "boolean"
      ? (pickDenormFromResult(mergedPayload, "weighted") as boolean)
      : null

  const dataSourceMode =
    typeof pickDenormFromResult(mergedPayload, "data_source_mode") === "string"
      ? (pickDenormFromResult(mergedPayload, "data_source_mode") as string)
      : FALLBACK_DATA_SOURCE_MODE

  const { error: updateAnchorError } = await admin
    .from("chat_results")
    .update({
      status: input.status,
      result_payload: mergedPayload,
      weighted,
      data_source_mode: dataSourceMode ?? FALLBACK_DATA_SOURCE_MODE,
      system_version: input.systemVersion ?? null,
      persona_segment_id: input.personaSegmentId ?? null,
      persona_segment_name: input.personaSegmentName ?? null,
      persona_segment_color_token: segmentColorTokenForDatabase(
        input.personaSegmentColorToken ?? null
      ),
      custom_audience_id: input.customAudienceId ?? null,
      custom_audience_name: input.customAudienceName ?? null,
      custom_audience_child_segment_ids:
        input.customAudienceChildSegmentIds ?? null,
      custom_audience_child_segment_names:
        input.customAudienceChildSegmentNames ?? null,
      custom_audience_child_segment_color_tokens:
        input.customAudienceChildSegmentColorTokens?.map((t) =>
          segmentColorTokenForDatabase(t)
        ) ?? null,
      chat_context_mode: input.chatContextMode ?? "default",
      show_in_chat_history: input.showInChatHistory ?? true,
    })
    .eq("request_id", input.anchorRequestId)

  if (updateAnchorError) {
    return {
      ok: false,
      error: updateAnchorError.message ?? "Failed to update thread anchor row.",
      status: 500,
    }
  }

  const { error: mergeCreditError } = await admin.rpc(
    "apply_project_credit_for_thread_merge",
    {
      p_job_request_id: input.jobRequestId,
      p_anchor_request_id: input.anchorRequestId,
    }
  )

  if (mergeCreditError) {
    return {
      ok: false,
      error: mergeCreditError.message ?? "Failed to apply merge credit charge.",
      status: 500,
    }
  }

  const { error: deleteJobError } = await admin
    .from("chat_results")
    .delete()
    .eq("request_id", input.jobRequestId)
    .eq("user_id", input.actorUserId)

  if (deleteJobError) {
    return {
      ok: false,
      error: deleteJobError.message ?? "Failed to remove job row.",
      status: 500,
    }
  }

  return { ok: true }
}
