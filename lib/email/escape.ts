export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Use for href/src values that may contain Supabase Go template literals. */
export function escapeAttr(value: string): string {
  return escapeHtml(value)
}
