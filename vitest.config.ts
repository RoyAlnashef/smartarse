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
      "lib/supabase/session-from-url.test.ts",
      "lib/demo-access/tokens.test.ts",
      "lib/demo-access/config.test.ts",
    ],
  },
})
