import { SUPPORT_EMAIL } from "@/lib/support-contact"
import { escapeAttr, escapeHtml } from "@/lib/email/escape"
import { emailColors, emailFontStack } from "@/lib/email/tokens"

export type EmailButtonVariant = "primary" | "secondary"

function emailButtonStyle(variant: EmailButtonVariant): string {
  const isPrimary = variant === "primary"
  return [
    "display:inline-block",
    "padding:12px 24px",
    "border-radius:999px",
    `border:2px solid ${emailColors.border}`,
    "font-size:13px",
    "font-weight:800",
    "text-decoration:none",
    "text-transform:uppercase",
    "letter-spacing:0.06em",
    `background:${isPrimary ? emailColors.pink : emailColors.card}`,
    `color:${emailColors.text}`,
  ].join(";")
}

export function renderEmailButton(
  href: string,
  label: string,
  variant: EmailButtonVariant = "primary",
): string {
  return `<a href="${escapeAttr(href)}" style="${emailButtonStyle(variant)}">${escapeHtml(label)}</a>`
}

export function renderEmailButtonRow(
  buttons: Array<{ href: string; label: string; variant?: EmailButtonVariant }>,
): string {
  const cells = buttons
    .map((button, index) => {
      const paddingLeft = index === 0 ? "0" : "10px"
      return `<td style="padding:0 0 0 ${paddingLeft};">${renderEmailButton(button.href, button.label, button.variant ?? "primary")}</td>`
    })
    .join("")

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;"><tr>${cells}</tr></table>`
}

export function renderBrandFooter(): string {
  const mailto = `mailto:${SUPPORT_EMAIL}`
  return `smartA.R.S.E. · <a href="${escapeAttr(mailto)}" style="color:${emailColors.muted};text-decoration:underline;">${escapeHtml(SUPPORT_EMAIL)}</a>`
}

export function renderEmailLogo(logoUrl: string): string {
  return `<img src="${escapeAttr(logoUrl)}" alt="smartA.R.S.E." width="180" style="display:block;max-width:100%;height:auto;border:0;" />`
}

export { emailColors, emailFontStack }
