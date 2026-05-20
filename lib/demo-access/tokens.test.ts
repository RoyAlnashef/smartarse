import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  createDemoApprovalToken,
  verifyDemoApprovalToken,
} from "@/lib/demo-access/tokens"

describe("demo approval tokens", () => {
  const previous = process.env.DEMO_APPROVAL_SECRET

  beforeEach(() => {
    process.env.DEMO_APPROVAL_SECRET = "test-secret-for-hmac"
  })

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.DEMO_APPROVAL_SECRET
    } else {
      process.env.DEMO_APPROVAL_SECRET = previous
    }
  })

  it("round-trips approve tokens", () => {
    const token = createDemoApprovalToken("req-1", "approve")
    expect(token).toBeTruthy()
    const verified = verifyDemoApprovalToken(token!, "approve")
    expect(verified.ok).toBe(true)
    if (verified.ok) {
      expect(verified.payload.requestId).toBe("req-1")
    }
  })

  it("rejects wrong action", () => {
    const token = createDemoApprovalToken("req-1", "approve")
    const verified = verifyDemoApprovalToken(token!, "reject")
    expect(verified.ok).toBe(false)
  })
})
