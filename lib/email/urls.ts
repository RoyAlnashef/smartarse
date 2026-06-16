import { getAppBaseUrl } from "@/lib/demo-access/config"

export const EMAIL_LOGO_PATH = "/client-header-logo.gif"

export function getEmailLogoUrl(baseUrl?: string): string {
  const root = (baseUrl ?? getAppBaseUrl()).replace(/\/$/, "")
  return `${root}${EMAIL_LOGO_PATH}`
}

export function supabaseEmailLogoUrl(): string {
  return `{{ .SiteURL }}${EMAIL_LOGO_PATH}`
}

export function supabaseConfirmLink(type: string, nextPath: string): string {
  return `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${nextPath}`
}
