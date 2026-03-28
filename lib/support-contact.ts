/** Support inbox for client-facing “Contact the team” links. */
export const SUPPORT_EMAIL = "smart-arse@disrupt-insight.com"

/**
 * Gmail compose URL — safe to use with target="_blank" (tab shows compose UI).
 * Avoid mailto: + target="_blank"; browsers open an empty tab because there is no document to render.
 */
export const SUPPORT_CONTACT_NEW_TAB_HREF = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}`
