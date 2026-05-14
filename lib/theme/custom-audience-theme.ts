export function normalizeAudienceColorToken(
  token: string | null | undefined
): string | null {
  const value = token?.trim()
  if (!value) return null
  return value.startsWith("bg-") ? value.slice(3) : value
}

export function audienceStackColorTokens(
  childTokens: string[] | null | undefined,
  personaToken: string | null | undefined
): string[] {
  const normalized = (childTokens ?? [])
    .map((token) => normalizeAudienceColorToken(token))
    .filter((token): token is string => Boolean(token))
  if (normalized.length > 0) return normalized
  const fallback = normalizeAudienceColorToken(personaToken)
  return fallback ? [fallback] : []
}
