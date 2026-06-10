import { createHash, timingSafeEqual } from "crypto"

/** Constant-time comparison for shared Bearer secrets (cron, webhooks). */
export function secretsMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false
  const a = createHash("sha256").update(provided, "utf8").digest()
  const b = createHash("sha256").update(expected, "utf8").digest()
  return timingSafeEqual(a, b)
}
