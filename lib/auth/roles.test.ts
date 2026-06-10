import { describe, expect, it } from "vitest"
import { isDashboardAdminRole, toSupportedRole } from "@/lib/auth/roles"

describe("isDashboardAdminRole", () => {
  it("accepts normalized admin values", () => {
    expect(isDashboardAdminRole("admin")).toBe(true)
    expect(isDashboardAdminRole(" Admin ")).toBe(true)
    expect(isDashboardAdminRole("ADMIN")).toBe(true)
  })

  it("rejects non-admin roles", () => {
    expect(isDashboardAdminRole("client")).toBe(false)
    expect(isDashboardAdminRole(null)).toBe(false)
  })
})

describe("toSupportedRole", () => {
  it("normalizes known roles", () => {
    expect(toSupportedRole("CLIENT")).toBe("client")
    expect(toSupportedRole(" user ")).toBe("user")
  })

  it("defaults unknown roles to client", () => {
    expect(toSupportedRole("superadmin")).toBe("client")
  })
})
