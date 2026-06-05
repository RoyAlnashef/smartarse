export function userRequiresPasswordSetup(
  appMetadata: Record<string, unknown> | undefined
): boolean {
  return appMetadata?.requires_password_setup === true
}

export function displayNameFromDemoRequest(row: {
  first_name: string | null
  last_name: string | null
  email: string
}): string {
  const parts = [row.first_name, row.last_name]
    .map((s) => s?.trim())
    .filter(Boolean)
  if (parts.length > 0) return parts.join(" ")
  return row.email.split("@")[0] || "Demo User"
}
