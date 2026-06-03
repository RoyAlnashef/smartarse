import { describe, expect, it } from "vitest"
import { authorizeCronRequest } from "@/lib/api/authorize-cron-request"

describe("authorizeCronRequest", () => {
  it("rejects requests without CRON_SECRET configured", async () => {
    const previous = process.env.CRON_SECRET
    delete process.env.CRON_SECRET

    const response = authorizeCronRequest(
      new Request("http://localhost/api/cron/support-notifications"),
    )

    expect(response?.status).toBe(503)

    if (previous === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = previous
    }
  })

  it("rejects requests with invalid bearer token", async () => {
    const previous = process.env.CRON_SECRET
    process.env.CRON_SECRET = "secret"

    const response = authorizeCronRequest(
      new Request("http://localhost/api/cron/support-notifications", {
        headers: { Authorization: "Bearer wrong" },
      }),
    )

    expect(response?.status).toBe(401)

    if (previous === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = previous
    }
  })

  it("allows requests with matching bearer token", () => {
    const previous = process.env.CRON_SECRET
    process.env.CRON_SECRET = "secret"

    const response = authorizeCronRequest(
      new Request("http://localhost/api/cron/support-notifications", {
        headers: { Authorization: "Bearer secret" },
      }),
    )

    expect(response).toBeNull()

    if (previous === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = previous
    }
  })
})
