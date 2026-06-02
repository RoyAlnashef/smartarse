import { afterEach, describe, expect, it } from "vitest"
import {
  extractEmailAddress,
  getFromAddressForRecipients,
  getInternalNotificationFromAddress,
  getProspectFromAddress,
  getTransactionalReplyToAddress,
  isSameMailbox,
  isSupportNotificationRecipient,
} from "@/lib/demo-access/config"

describe("demo access transactional email config", () => {
  const envKeys = [
    "EMAIL_FROM_ADDRESS",
    "EMAIL_RESEND_SANDBOX",
    "DEMO_NOTIFICATION_EMAIL",
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

  it("uses noreply From for support notification recipients", () => {
    snapshotEnv()
    process.env.EMAIL_FROM_ADDRESS =
      "Disrupt <smart-arse@disrupt-insight.com>"
    expect(getFromAddressForRecipients("smart-arse@disrupt-insight.com")).toBe(
      "smartA.R.S.E. <noreply@disrupt-insight.com>",
    )
  })

  it("uses support inbox From for prospect recipients", () => {
    snapshotEnv()
    process.env.EMAIL_FROM_ADDRESS =
      "Disrupt <smart-arse@disrupt-insight.com>"
    expect(getFromAddressForRecipients("prospect@example.com")).toBe(
      "Disrupt <smart-arse@disrupt-insight.com>",
    )
  })

  it("defaults prospect From to support inbox when EMAIL_FROM_ADDRESS is unset", () => {
    snapshotEnv()
    expect(getProspectFromAddress()).toBe(
      "smartA.R.S.E. <smart-arse@disrupt-insight.com>",
    )
  })

  it("defaults internal From to noreply when EMAIL_FROM_ADDRESS is unset", () => {
    snapshotEnv()
    expect(getInternalNotificationFromAddress()).toBe(
      "smartA.R.S.E. <noreply@disrupt-insight.com>",
    )
  })

  it("uses noreply for DEMO_NOTIFICATION_EMAIL override inbox", () => {
    snapshotEnv()
    process.env.DEMO_NOTIFICATION_EMAIL = "tester@example.com"
    expect(isSupportNotificationRecipient("tester@example.com")).toBe(true)
    expect(getFromAddressForRecipients("tester@example.com")).toBe(
      "smartA.R.S.E. <noreply@disrupt-insight.com>",
    )
    expect(getFromAddressForRecipients("prospect@example.com")).toBe(
      "smartA.R.S.E. <smart-arse@disrupt-insight.com>",
    )
  })

  it("uses Resend sandbox From when EMAIL_RESEND_SANDBOX is set", () => {
    snapshotEnv()
    process.env.EMAIL_RESEND_SANDBOX = "true"
    expect(getInternalNotificationFromAddress()).toBe(
      "Disrupt Demo <onboarding@resend.dev>",
    )
    expect(getProspectFromAddress()).toBe(
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
