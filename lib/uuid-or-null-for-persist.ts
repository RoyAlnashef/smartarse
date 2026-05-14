/** 8-4-4-4-12 hex hyphenated id (Postgres `uuid` text form). Rejects client `draft-*` / `archived:*` tokens. */
const UUID_STRING_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function uuidOrNullForPersist(id: string | null | undefined): string | null {
  if (id == null || typeof id !== "string") return null
  const trimmed = id.trim()
  return UUID_STRING_RE.test(trimmed) ? trimmed : null
}
