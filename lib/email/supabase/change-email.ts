import {
  renderEmailButton,
  renderEmailLayout,
  supabaseConfirmLink,
  supabaseEmailLogoUrl,
} from "@/lib/email"

export function buildChangeEmailEmail(): { subject: string; html: string } {
  const confirmUrl = supabaseConfirmLink("email_change", "/client/settings")

  return {
    subject: "Confirm your new smartA.R.S.E. email",
    html: renderEmailLayout({
      supabaseMode: true,
      logoUrl: supabaseEmailLogoUrl(),
      title: "Confirm email change",
      intro: "You requested to change the email address on your smartA.R.S.E. account. Confirm the change using the link below.",
      bodyHtml: `<p style="margin:0 0 12px;">${renderEmailButton(confirmUrl, "Confirm new email", "primary")}</p>
<p style="margin:0;font-size:14px;color:#545454;">If you did not request this change, contact support immediately.</p>`,
      footer: "This confirmation link expires after a short period.",
    }),
  }
}
