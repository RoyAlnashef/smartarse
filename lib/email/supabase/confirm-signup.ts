import {
  renderEmailButton,
  renderEmailLayout,
  supabaseConfirmLink,
  supabaseEmailLogoUrl,
} from "@/lib/email"

export function buildConfirmSignupEmail(): { subject: string; html: string } {
  const confirmUrl = supabaseConfirmLink("signup", "/client/projects")

  return {
    subject: "Confirm your smartA.R.S.E. account",
    html: renderEmailLayout({
      supabaseMode: true,
      logoUrl: supabaseEmailLogoUrl(),
      title: "Confirm your email",
      intro: "Thanks for signing up for smartA.R.S.E. Confirm your email address to finish creating your account.",
      bodyHtml: `<p style="margin:0 0 12px;">${renderEmailButton(confirmUrl, "Confirm email", "primary")}</p>
<p style="margin:0;font-size:14px;color:#545454;">If you did not create an account, you can ignore this email.</p>`,
      footer: "This confirmation link expires after a short period.",
    }),
  }
}
