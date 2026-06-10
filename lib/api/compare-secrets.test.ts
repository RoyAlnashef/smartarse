import { describe, expect, it } from "vitest"
import { secretsMatch } from "@/lib/api/compare-secrets"

describe("secretsMatch", () => {
  it("returns true for equal secrets", () => {
    expect(secretsMatch("secret-value", "secret-value")).toBe(true)
  })

  it("returns false for mismatched secrets", () => {
    expect(secretsMatch("wrong", "secret-value")).toBe(false)
  })

  it("returns false when either value is empty", () => {
    expect(secretsMatch("", "secret-value")).toBe(false)
    expect(secretsMatch("secret-value", "")).toBe(false)
  })
})
