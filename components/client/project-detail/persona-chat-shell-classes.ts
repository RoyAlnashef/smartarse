/**
 * Shared shell height for client project chat + desktop personas column.
 * `--client-workspace-chrome-y` is set on the client layout root (`app/client/layout.tsx`)
 * so shells never exceed the viewport below the header/footer and project page padding.
 */
export const PERSONA_CHAT_SHELL_CLASS =
  "min-h-[28rem] max-h-[calc(100dvh-var(--client-workspace-chrome-y,17.5rem))] h-[min(32rem,calc(100dvh-var(--client-workspace-chrome-y,10rem)))] lg:h-full lg:min-h-0"

/** Desktop personas column: hug content up to the viewport cap (then inner areas scroll). */
export const PERSONA_RIGHT_COLUMN_SHELL_CLASS =
  "h-fit max-h-[calc(100dvh-var(--client-workspace-chrome-y,17.5rem))] min-h-0 w-full"
