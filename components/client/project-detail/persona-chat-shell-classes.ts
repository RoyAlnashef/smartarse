/**
 * Shared shell height for client project chat + desktop personas column.
 * `--client-workspace-chrome-y` is set on the client layout root (`app/client/layout.tsx`)
 * so shells never exceed the viewport below the header/footer and project page padding.
 *
 * Mobile chat: `h-fit` hugs short content (e.g. segment activation cards); grows until
 * `max-h-[min(32rem,...)]`, then the inner transcript scrolls.
 *
 * Desktop chat: `lg:h-full` with a 600px floor fills the workspace column; on short
 * viewports `min-height` overrides `max-height` per CSS spec so the page scrolls rather
 * than squishing the chat.
 */
export const PERSONA_CHAT_SHELL_CLASS =
  "h-fit max-h-[min(32rem,calc(100dvh-var(--client-workspace-chrome-y,10rem)))] lg:h-full lg:min-h-[600px] lg:max-h-[calc(100dvh-var(--client-workspace-chrome-y,17.5rem))]"

/** Desktop personas column: hug content up to the viewport cap (then inner areas scroll). */
export const PERSONA_RIGHT_COLUMN_SHELL_CLASS =
  "h-fit max-h-[calc(100dvh-var(--client-workspace-chrome-y,17.5rem))] min-h-[600px] w-full"
