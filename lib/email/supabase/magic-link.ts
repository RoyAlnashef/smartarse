import {
  renderEmailButton,
  renderEmailLayout,
  supabaseConfirmLink,
  supabaseEmailLogoUrl,
} from "@/lib/email"

export function buildMagicLinkEmail(): { subject: string; html: string } {
  const magicUrl = supabaseConfirmLink("magiclink", "/client/projects")

  return {
    subject: "Your smartA.R.S.E. sign-in link",
    html: renderEmailLayout({
      supabaseMode: true,
      logoUrl: supabaseEmailLogoUrl(),
      title: "Sign in to smartA.R.S.E.",
      intro: "Use the link below to sign in to your account. No password is required for this sign-in.",
      bodyHtml: `<p style="margin:0 0 12px;">${renderEmailButton(magicUrl, "Sign in", "primary")}</p>
<p style="margin:0;font-size:14px;color:#545454;">If you did not request this link, you can ignore this email.</p>`,
      footer: "This sign-in link expires after a short period.",
    }),
  }
}
