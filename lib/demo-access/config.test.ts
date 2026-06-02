import { afterEach, describe, expect, it } from "vitest"
import {
  extractEmailAddress,
  getTransactionalFromAddress,
  getTransactionalReplyToAddress,
  isSameMailbox,
} from "@/lib/demo-access/config"

describe("demo access transactional email config", () => {
  const envKeys = [
    "EMAIL_FROM_ADDRESS",
    "EMAIL_RESEND_SANDBOX",
  ] as const
  const previous: Record<string, string | undefined> = {}

  afterEach(() => {
    for (const key of envKeys) {
      if (previous[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previous[key]
      }
    }
  })

  function snapshotEnv() {
    for (const key of envKeys) {
      previous[key] = process.env[key]
      delete process.env[key]
    }
  }

  it("defaults From to noreply on support domain when EMAIL_FROM_ADDRESS matches support inbox", () => {
    snapshotEnv()
    process.env.EMAIL_FROM_ADDRESS =
      "Disrupt <smart-arse@disrupt-insight.com>"
    expect(getTransactionalFromAddress()).toBe(
      "smartA.R.S.E. <noreply@disrupt-insight.com>",
    )
  })

  it("uses EMAIL_FROM_ADDRESS when it differs from support inbox", () => {
    snapshotEnv()
    process.env.EMAIL_FROM_ADDRESS =
      "Disrupt <notifications@disrupt-insight.com>"
    expect(getTransactionalFromAddress()).toBe(
      "Disrupt <notifications@disrupt-insight.com>",
    )
  })

  it("defaults From to noreply when EMAIL_FROM_ADDRESS is unset", () => {
    snapshotEnv()
    expect(getTransactionalFromAddress()).toBe(
      "smartA.R.S.E. <noreply@disrupt-insight.com>",
    )
  })

  it("uses Resend sandbox From when EMAIL_RESEND_SANDBOX is set", () => {
    snapshotEnv()
    process.env.EMAIL_RESEND_SANDBOX = "true"
    expect(getTransactionalFromAddress()).toBe(
      "Disrupt Demo <onboarding@resend.dev>",
    )
  })

  it("sets Reply-To to support inbox", () => {
    expect(getTransactionalReplyToAddress()).toBe(
      "smart-arse@disrupt-insight.com",
    )
  })

  it("compares mailbox addresses case-insensitively", () => {
    expect(
      isSameMailbox(
        extractEmailAddress("Team <Smart-Arse@Disrupt-Insight.com>"),
        "smart-arse@disrupt-insight.com",
      ),
    ).toBe(true)
  })
})
