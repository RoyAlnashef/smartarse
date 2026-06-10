import { describe, expect, it } from "vitest"
import { n8nWebhookBodySchema } from "@/lib/n8n-webhook-body-schema"

const validBody = {
  chatInput: "Hello",
  org_id: "a0000000-0000-4000-8000-000000000001",
  user_id: "b0000000-0000-4000-8000-000000000002",
  request_id: "c0000000-0000-4000-8000-000000000003",
  sessionId: "sess-1",
  project_id: "d0000000-0000-4000-8000-000000000004",
  weighted: true,
  data_source_mode: "both",
  qual_enabled: true,
}

describe("n8nWebhookBodySchema", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = n8nWebhookBodySchema.safeParse(validBody)
    expect(parsed.success).toBe(true)
  })

  it("rejects missing required fields", () => {
    const parsed = n8nWebhookBodySchema.safeParse({ chatInput: "Hi" })
    expect(parsed.success).toBe(false)
  })

  it("preserves unknown passthrough fields", () => {
    const parsed = n8nWebhookBodySchema.safeParse({
      ...validBody,
      future_n8n_field: "ok",
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.future_n8n_field).toBe("ok")
    }
  })
})
