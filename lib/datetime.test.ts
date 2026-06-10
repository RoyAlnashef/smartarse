import { afterEach, describe, expect, it, vi } from "vitest"
import {
  formatCalendarDateLocal,
  formatLondonCalendarDate,
  londonCalendarDateString,
  londonCalendarDaysUntil,
} from "@/lib/datetime"
import { isAccessDateExpired } from "@/lib/project-status"

afterEach(() => {
  vi.useRealTimers()
})

describe("londonCalendarDateString", () => {
  it("returns the London calendar day during GMT (winter)", () => {
    const d = new Date("2026-01-15T23:30:00.000Z")
    expect(londonCalendarDateString(d)).toBe("2026-01-15")
  })

  it("returns the next London calendar day late evening UTC during BST (summer)", () => {
    const d = new Date("2026-06-10T23:30:00.000Z")
    expect(londonCalendarDateString(d)).toBe("2026-06-11")
  })

  it("uses the mocked system clock when no date is passed", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-10T23:30:00.000Z"))
    expect(londonCalendarDateString()).toBe("2026-06-11")
  })
})

describe("londonCalendarDaysUntil", () => {
  it("returns 0 when the target date is today in London", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"))
    expect(londonCalendarDaysUntil("2026-03-15")).toBe(0)
  })

  it("returns a positive count for a future London calendar date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"))
    expect(londonCalendarDaysUntil("2026-03-20")).toBe(5)
  })

  it("returns a negative count for a past London calendar date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"))
    expect(londonCalendarDaysUntil("2026-03-10")).toBe(-5)
  })
})

describe("formatLondonCalendarDate", () => {
  it("formats a stored YYYY-MM-DD without shifting the calendar day", () => {
    expect(formatLondonCalendarDate("2026-06-10")).toMatch(/10/)
    expect(formatLondonCalendarDate("2026-06-10")).toMatch(/2026/)
  })
})

describe("formatCalendarDateLocal", () => {
  it("formats YYYY-MM-DD as dd/MM/yyyy", () => {
    expect(formatCalendarDateLocal("2026-06-10")).toBe("10/06/2026")
  })
})

describe("isAccessDateExpired", () => {
  it("is false when access ends today in London", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"))
    expect(isAccessDateExpired("2026-03-15")).toBe(false)
  })

  it("is true when access ended before today in London", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"))
    expect(isAccessDateExpired("2026-03-14")).toBe(true)
  })

  it("is false for null or empty access dates", () => {
    expect(isAccessDateExpired(null)).toBe(false)
    expect(isAccessDateExpired("")).toBe(false)
  })
})
