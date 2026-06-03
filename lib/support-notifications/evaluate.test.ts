import { describe, expect, it } from "vitest"
import {
  eventKeyForExpiryDays,
  notificationTypeForExpiryDays,
  shouldClearCreditLowLog,
  shouldQueueCreditLowAlert,
  shouldSendExpiryReminder,
} from "@/lib/support-notifications/evaluate"

describe("support notification evaluate helpers", () => {
  it("matches expiry reminder windows at 28 and 14 days", () => {
    expect(shouldSendExpiryReminder(28)).toBe(true)
    expect(shouldSendExpiryReminder(14)).toBe(true)
    expect(shouldSendExpiryReminder(27)).toBe(false)
    expect(shouldSendExpiryReminder(15)).toBe(false)
  })

  it("maps expiry days to notification types and event keys", () => {
    expect(notificationTypeForExpiryDays(28)).toBe("access_expires_4_weeks")
    expect(notificationTypeForExpiryDays(14)).toBe("access_expires_2_weeks")
    expect(eventKeyForExpiryDays(28)).toBe("access_28d")
    expect(eventKeyForExpiryDays(14)).toBe("access_14d")
    expect(notificationTypeForExpiryDays(10)).toBeNull()
    expect(eventKeyForExpiryDays(10)).toBeNull()
  })

  it("clears credit low log when balance restored or threshold unset", () => {
    expect(
      shouldClearCreditLowLog({
        creditBalance: 50,
        creditAlertThreshold: 40,
      }),
    ).toBe(true)
    expect(
      shouldClearCreditLowLog({
        creditBalance: 10,
        creditAlertThreshold: null,
      }),
    ).toBe(true)
    expect(
      shouldClearCreditLowLog({
        creditBalance: 10,
        creditAlertThreshold: 40,
      }),
    ).toBe(false)
  })

  it("queues credit low alert on threshold crossing", () => {
    expect(
      shouldQueueCreditLowAlert({
        creditBalance: 30,
        creditAlertThreshold: 40,
        previousCreditBalance: 45,
        hasExistingCreditLowLog: false,
      }),
    ).toBe(true)

    expect(
      shouldQueueCreditLowAlert({
        creditBalance: 30,
        creditAlertThreshold: 40,
        previousCreditBalance: 35,
        hasExistingCreditLowLog: true,
      }),
    ).toBe(false)

    expect(
      shouldQueueCreditLowAlert({
        creditBalance: 30,
        creditAlertThreshold: 40,
        previousCreditBalance: null,
        hasExistingCreditLowLog: false,
      }),
    ).toBe(true)

    expect(
      shouldQueueCreditLowAlert({
        creditBalance: 50,
        creditAlertThreshold: 40,
        previousCreditBalance: 45,
        hasExistingCreditLowLog: false,
      }),
    ).toBe(false)
  })
})
