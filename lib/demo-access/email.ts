import { Resend } from "resend"
import { getSupportNotificationEmail } from "@/lib/support-notification-email"
import {
  getEmailFromAddress,
  getEmailProviderApiKey,
} from "@/lib/demo-access/config"
import {
  escapeHtml,
  formatDemoTimestamp,
  renderEmailButton,
  renderEmailLayout,
} from "@/lib/demo-access/templates/shared"

function getResendClient(): Resend | null {
  const apiKey = getEmailProviderApiKey()
  if (!apiKey) return null
  return new Resend(apiKey)
}

async function sendEmail(options: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const from = getEmailFromAddress()
  const resend = getResendClient()
  if (!from || !resend) {
    return { ok: false, error: "Email is not configured." }
  }

  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function sendDemoRequestNotificationEmail(options: {
  requesterEmail: string
  requestedAt: string
  approveUrl: string
  rejectUrl: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = getSupportNotificationEmail()
  const requestedLabel = formatDemoTimestamp(options.requestedAt)

  const html = renderEmailLayout({
    title: "New demo request",
    intro: "A new demo access request was submitted.",
    bodyHtml: `<p style="margin:0 0 14px;"><strong>Email:</strong> ${escapeHtml(options.requesterEmail)}<br /><strong>Requested:</strong> ${escapeHtml(requestedLabel)}</p>
<p style="margin:0;display:flex;gap:10px;flex-wrap:wrap;">
  ${renderEmailButton(options.approveUrl, "Approve", "primary")}
  ${renderEmailButton(options.rejectUrl, "Reject", "secondary")}
</p>`,
    footer: "Links expire after the configured approval window.",
  })

  return sendEmail({
    to,
    subject: `New smartA.R.S.E. demo request from ${options.requesterEmail}`,
    html,
    text: `New demo request\n\nEmail: ${options.requesterEmail}\nRequested: ${requestedLabel}\n\nApprove: ${options.approveUrl}\nReject: ${options.rejectUrl}`,
  })
}

export async function sendDemoMagicLinkEmail(options: {
  to: string
  magicLink: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const html = renderEmailLayout({
    title: "Your Disrupt demo access",
    intro: "Your demo access to smartA.R.S.E. has been approved.",
    bodyHtml: `<p style="margin:0;">${renderEmailButton(options.magicLink, "Open demo", "primary")}</p>`,
    footer:
      "This link expires in about 24 hours. If it expires, contact the team to request a new link.",
  })

  return sendEmail({
    to: options.to,
    subject: "Your Disrupt - smartA.R.S.E. demo access",
    html,
    text: `Your demo access to smartA.R.S.E. has been approved.\n\nOpen demo: ${options.magicLink}\n\nThis link expires in about 24 hours.`,
  })
}

export async function sendDemoRejectionEmail(options: {
  to: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const html = renderEmailLayout({
    title: "Your demo request",
    intro: "Thank you for your interest in smartA.R.S.E.",
    bodyHtml:
      "<p style=\"margin:0;\">We are unable to approve demo access at this time. If you believe this is an error, please contact the team.</p>",
    footer: "You can submit a new request at any time from the demo access page.",
  })

  return sendEmail({
    to: options.to,
    subject: "Your Disrupt - smartA.R.S.E. demo access",
    html,
    text: `Thank you for your interest in smartA.R.S.E.\n\nWe are unable to approve demo access for your request at this time. If you believe this is an error, please contact our team.\n\n— Disrupt Insight`,
  })
}
