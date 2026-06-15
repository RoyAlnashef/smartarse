/** Support inbox for client-facing “Contact the team” links. */
export const SUPPORT_EMAIL = "smart-arse@disrupt-insight.com"

/** mailto: href for support contact links. */
export function supportMailtoHref(email: string = SUPPORT_EMAIL): string {
  return `mailto:${email}`
}
