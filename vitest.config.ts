import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "node",
    include: [
      "lib/chat-thread.test.ts",
      "lib/citation-utils.test.ts",
      "lib/supabase/session-from-url.test.ts",
      "lib/demo-access/tokens.test.ts",
      "lib/demo-access/config.test.ts",
      "lib/support-notifications/evaluate.test.ts",
      "lib/api/authorize-cron-request.test.ts",
      "lib/api/compare-secrets.test.ts",
      "lib/auth/roles.test.ts",
      "lib/n8n-webhook-body-schema.test.ts",
      "lib/datetime.test.ts",
    ],
  },
})
