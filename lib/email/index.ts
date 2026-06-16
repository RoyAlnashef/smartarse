export { escapeHtml, escapeAttr } from "@/lib/email/escape"
export {
  renderEmailButton,
  renderEmailButtonRow,
  renderBrandFooter,
  renderEmailLogo,
  emailColors,
  emailFontStack,
  type EmailButtonVariant,
} from "@/lib/email/components"
export { renderEmailLayout, type RenderEmailLayoutOptions } from "@/lib/email/layout"
export {
  EMAIL_LOGO_PATH,
  getEmailLogoUrl,
  supabaseEmailLogoUrl,
  supabaseConfirmLink,
} from "@/lib/email/urls"
export { emailColors as emailTokens, emailLogoWidth, emailCardMaxWidth } from "@/lib/email/tokens"
