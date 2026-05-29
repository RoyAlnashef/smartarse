import { describe, expect, it } from "vitest"
import { parseAuthHashParams } from "@/lib/supabase/session-from-url"

describe("parseAuthHashParams", () => {
  it("parses access and refresh tokens from hash", () => {
    const hash =
      "#access_token=abc&refresh_token=def&expires_in=3600&type=magiclink"
    expect(parseAuthHashParams(hash)).toEqual({
      accessToken: "abc",
      refreshToken: "def",
    })
  })

  it("returns nulls for empty hash", () => {
    expect(parseAuthHashParams("")).toEqual({
      accessToken: null,
      refreshToken: null,
    })
  })
})
