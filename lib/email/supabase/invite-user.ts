import {
  renderEmailButton,
  renderEmailLayout,
  supabaseConfirmLink,
  supabaseEmailLogoUrl,
} from "@/lib/email"

export function buildInviteUserEmail(): { subject: string; html: string } {
  const inviteUrl = supabaseConfirmLink("invite", "/auth/reset-password")

  return {
    subject: "You have been invited to smartA.R.S.E.",
    html: renderEmailLayout({
      supabaseMode: true,
      logoUrl: supabaseEmailLogoUrl(),
      title: "You are invited",
      intro: "You have been invited to join smartA.R.S.E. Accept the invitation and set your password to get started.",
      bodyHtml: `<p style="margin:0 0 12px;">${renderEmailButton(inviteUrl, "Accept invitation", "primary")}</p>
<p style="margin:0;font-size:14px;color:#545454;">If you were not expecting this invitation, you can ignore this email.</p>`,
      footer: "This invitation link expires after a short period.",
    }),
  }
}
