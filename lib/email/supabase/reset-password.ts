import {
  renderEmailButton,
  renderEmailLayout,
  supabaseConfirmLink,
  supabaseEmailLogoUrl,
} from "@/lib/email"

export function buildResetPasswordEmail(): { subject: string; html: string } {
  const resetUrl = supabaseConfirmLink("recovery", "/auth/reset-password")

  return {
    subject: "Reset your smartA.R.S.E. password",
    html: renderEmailLayout({
      supabaseMode: true,
      logoUrl: supabaseEmailLogoUrl(),
      title: "Reset your password",
      intro: "Follow the link below to choose a new password for your smartA.R.S.E. account.",
      bodyHtml: `<p style="margin:0 0 12px;">${renderEmailButton(resetUrl, "Reset password", "primary")}</p>
<p style="margin:0;font-size:14px;color:#545454;">If you did not request this, you can ignore this email.</p>`,
      footer: "This link expires after a short period for your security.",
    }),
  }
}
