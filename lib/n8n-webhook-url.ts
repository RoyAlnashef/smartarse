/**
 * Public webhook URL for browser-side chat POSTs.
 * Prefer `NEXT_PUBLIC_N8N_URL` (chat-history-spec); `NEXT_PUBLIC_N8N_WEBHOOK_URL` matches README/server naming when exposed to the client.
 */
export function getN8nWebhookUrl(): string {
  return (
    process.env.NEXT_PUBLIC_N8N_URL?.trim() ||
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.trim() ||
    ""
  )
}
