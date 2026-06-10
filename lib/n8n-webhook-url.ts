/**
 * Same-origin proxy for browser chat POSTs. The browser calls `/api/n8n`; the route
 * forwards to n8n with server-only URL + secret.
 */
export const N8N_WEBHOOK_PROXY_PATH = "/api/n8n"

export {
  N8N_WEBHOOK_MAX_BODY_BYTES,
  n8nWebhookBodySchema,
} from "@/lib/n8n-webhook-body-schema"

export type N8nWebhookServerConfig = {
  url: string
  secret: string
}

/** Server-only n8n webhook config. Requires `N8N_WEBHOOK_URL` + `N8N_WEBHOOK_SECRET`. */
export function getN8nWebhookServerConfig(): N8nWebhookServerConfig | null {
  const url = process.env.N8N_WEBHOOK_URL?.trim() || ""
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim() || ""
  if (!url || !secret) {
    return null
  }
  return { url, secret }
}
