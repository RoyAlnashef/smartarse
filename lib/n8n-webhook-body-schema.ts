import { z } from "zod"

/** Max JSON body size accepted by POST /api/n8n (bytes). */
export const N8N_WEBHOOK_MAX_BODY_BYTES = 512_000

const projectDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(500),
  display_name: z.string().max(500).nullable(),
  cite_color_token: z.string().max(64).nullable().optional(),
  source_icon_key: z.string().max(64).nullable().optional(),
})

const customAudienceSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().max(300).nullable(),
  child_segment_ids: z.array(z.string().max(120)).nullable(),
  child_segment_names: z.array(z.string().max(300)).nullable(),
  child_segment_color_tokens: z.array(z.string().max(64).nullable()).nullable(),
})

/**
 * Validates the chat webhook body before proxying to n8n.
 * Unknown keys are preserved (`.passthrough()`) for forward-compatible n8n fields.
 */
export const n8nWebhookBodySchema = z
  .object({
    chatInput: z.string().trim().min(1).max(50_000),
    org_id: z.string().uuid(),
    user_id: z.string().uuid(),
    request_id: z.string().uuid(),
    sessionId: z.string().max(256),
    project_id: z.string().uuid(),
    weighted: z.boolean(),
    data_source_mode: z.string().max(120),
    qual_enabled: z.boolean(),
    thread_anchor_request_id: z.string().uuid().optional(),
    chatHistory: z
      .array(
        z.object({
          role: z.string().max(64),
          content: z.string().max(50_000),
        })
      )
      .max(100)
      .optional(),
    project_documents: z.array(projectDocumentSchema).max(200).optional(),
    chat_context_mode: z
      .enum(["default", "persona_segment", "custom_audience", "focus_group"])
      .optional(),
    custom_audience: customAudienceSchema.optional(),
    persona_mode: z.boolean().optional(),
    persona_brief: z.string().max(20_000).optional(),
    persona_brief_concern: z.number().min(0).max(10).optional(),
    focus_group: z.boolean().optional(),
    focus_group_session_id: z.string().uuid().optional(),
    focus_group_round_number: z.number().int().min(1).optional(),
    focus_group_participant_index: z.number().int().min(0).optional(),
  })
  .passthrough()

export type N8nWebhookBody = z.infer<typeof n8nWebhookBodySchema>
