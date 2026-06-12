/** Support inbox for client-facing “Contact the team” links. */
export const SUPPORT_EMAIL = "smart-arse@disrupt-insight.com"

/** mailto: href for inline contact links (no target="_blank"). */
export function supportMailtoHref(email: string = SUPPORT_EMAIL): string {
  return `mailto:${email}`
}

/**
 * Gmail compose URL — safe to use with target="_blank" (tab shows compose UI).
 * Avoid mailto: + target="_blank"; browsers open an empty tab because there is no document to render.
 */
export function supportContactNewTabHref(email: string = SUPPORT_EMAIL): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
}

/** @deprecated Use `supportContactNewTabHref()` with a resolved email instead. */
export const SUPPORT_CONTACT_NEW_TAB_HREF = supportContactNewTabHref(SUPPORT_EMAIL)
