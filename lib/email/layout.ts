import {
  renderBrandFooter,
  renderEmailLogo,
  emailColors,
  emailFontStack,
} from "@/lib/email/components"
import { escapeHtml } from "@/lib/email/escape"
import { getEmailLogoUrl } from "@/lib/email/urls"
import { emailCardMaxWidth } from "@/lib/email/tokens"

export type RenderEmailLayoutOptions = {
  title: string
  intro: string
  bodyHtml: string
  footer: string
  logoUrl?: string
  /** When true, logoUrl and bodyHtml may contain Supabase Go template literals. */
  supabaseMode?: boolean
}

export function renderEmailLayout(options: RenderEmailLayoutOptions): string {
  const logoUrl =
    options.logoUrl ??
    (options.supabaseMode ? `{{ .SiteURL }}/client-header-logo.gif` : getEmailLogoUrl())

  const title = escapeHtml(options.title)
  const intro = escapeHtml(options.intro)
  const footerNote = escapeHtml(options.footer)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:24px;background:${emailColors.bg};font-family:${emailFontStack};color:${emailColors.text};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:${emailCardMaxWidth}px;margin:0 auto;background:${emailColors.card};border:2px solid ${emailColors.border};border-radius:16px;box-shadow:4px 4px 0 ${emailColors.cyan};">
    <tr>
      <td style="padding:28px 24px 16px 24px;">
        ${renderEmailLogo(logoUrl)}
      </td>
    </tr>
    <tr>
      <td style="padding:0 24px 14px 24px;font-size:24px;font-weight:800;line-height:1.2;">${title}</td>
    </tr>
    <tr>
      <td style="padding:0 24px 8px 24px;font-size:16px;line-height:1.5;">${intro}</td>
    </tr>
    <tr>
      <td style="padding:0 24px 10px 24px;font-size:15px;line-height:1.5;">${options.bodyHtml}</td>
    </tr>
    <tr>
      <td style="padding:8px 24px 26px 24px;font-size:12px;line-height:1.5;color:${emailColors.muted};">
        ${footerNote}
        <br /><br />
        ${renderBrandFooter()}
      </td>
    </tr>
  </table>
</body>
</html>`
}
