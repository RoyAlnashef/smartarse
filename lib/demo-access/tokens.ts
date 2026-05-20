import { createHmac, timingSafeEqual } from "crypto"
import type { DemoApprovalAction } from "@/lib/demo-access/types"
import { getDemoApprovalSecret, getDemoApprovalTokenTtlHours } from "@/lib/demo-access/config"

export type DemoApprovalTokenPayload = {
  requestId: string
  action: DemoApprovalAction
  expiresAt: number
}

function encodePayload(payload: DemoApprovalTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

function decodePayload(encoded: string): DemoApprovalTokenPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8")
    const parsed = JSON.parse(json) as DemoApprovalTokenPayload
    if (
      typeof parsed.requestId !== "string" ||
      (parsed.action !== "approve" && parsed.action !== "reject") ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url")
}

export function createDemoApprovalToken(
  requestId: string,
  action: DemoApprovalAction
): string | null {
  const secret = getDemoApprovalSecret()
  if (!secret) return null

  const expiresAt =
    Date.now() + getDemoApprovalTokenTtlHours() * 60 * 60 * 1000
  const payload: DemoApprovalTokenPayload = { requestId, action, expiresAt }
  const encoded = encodePayload(payload)
  const signature = sign(encoded, secret)
  return `${encoded}.${signature}`
}

export function verifyDemoApprovalToken(
  token: string,
  expectedAction: DemoApprovalAction
): { ok: true; payload: DemoApprovalTokenPayload } | { ok: false; reason: string } {
  const secret = getDemoApprovalSecret()
  if (!secret) {
    return { ok: false, reason: "Approval links are not configured." }
  }

  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) {
    return { ok: false, reason: "Invalid approval link." }
  }

  const expectedSig = sign(encoded, secret)
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expectedSig)
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return { ok: false, reason: "Invalid approval link." }
  }

  const payload = decodePayload(encoded)
  if (!payload) {
    return { ok: false, reason: "Invalid approval link." }
  }

  if (payload.action !== expectedAction) {
    return { ok: false, reason: "This link does not match the requested action." }
  }

  if (Date.now() > payload.expiresAt) {
    return { ok: false, reason: "This approval link has expired." }
  }

  return { ok: true, payload }
}

export function buildDemoActionUrl(
  requestId: string,
  action: DemoApprovalAction,
  baseUrl: string
): string | null {
  const token = createDemoApprovalToken(requestId, action)
  if (!token) return null
  const path =
    action === "approve" ? "/api/demo/approve" : "/api/demo/reject"
  return `${baseUrl}${path}?token=${encodeURIComponent(token)}`
}
