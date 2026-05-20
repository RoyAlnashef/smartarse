import { Resend } from "resend"
import { getSupportNotificationEmail } from "@/lib/support-notification-email"
import {
  getEmailFromAddress,
  getEmailProviderApiKey,
} from "@/lib/demo-access/config"

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
  const requestedLabel = new Date(options.requestedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; color: #1a1a1a; line-height: 1.5;">
  <p>A new demo access request was submitted.</p>
  <p><strong>Email:</strong> ${escapeHtml(options.requesterEmail)}<br />
  <strong>Requested:</strong> ${escapeHtml(requestedLabel)}</p>
  <p>
    <a href="${escapeHtml(options.approveUrl)}" style="display:inline-block;margin-right:12px;padding:12px 24px;background:#00d4c8;color:#1a1a1a;text-decoration:none;font-weight:bold;border-radius:999px;border:2px solid #1a1a1a;">Approve</a>
    <a href="${escapeHtml(options.rejectUrl)}" style="display:inline-block;padding:12px 24px;background:#fff;color:#1a1a1a;text-decoration:none;font-weight:bold;border-radius:999px;border:2px solid #1a1a1a;">Reject</a>
  </p>
  <p style="font-size:12px;color:#666;">Links expire after the configured approval window.</p>
</body>
</html>`

  return sendEmail({
    to,
    subject: `New demo request from ${options.requesterEmail}`,
    html,
    text: `New demo request\n\nEmail: ${options.requesterEmail}\nRequested: ${requestedLabel}\n\nApprove: ${options.approveUrl}\nReject: ${options.rejectUrl}`,
  })
}

export async function sendDemoMagicLinkEmail(options: {
  to: string
  magicLink: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; color: #1a1a1a; line-height: 1.5; max-width: 480px;">
  <p>Your demo access to smartA.R.S.E. has been approved.</p>
  <p>
    <a href="${escapeHtml(options.magicLink)}" style="display:inline-block;padding:14px 28px;background:#ff6b9d;color:#1a1a1a;text-decoration:none;font-weight:bold;border-radius:999px;border:2px solid #1a1a1a;">Open demo</a>
  </p>
  <p style="font-size:12px;color:#666;">This link expires in about one hour. If it expires, contact the team to request a new link.</p>
</body>
</html>`

  return sendEmail({
    to: options.to,
    subject: "Your Disrupt demo access",
    html,
    text: `Your demo access to smartA.R.S.E. has been approved.\n\nOpen demo: ${options.magicLink}\n\nThis link expires in about one hour.`,
  })
}

export async function sendDemoRejectionEmail(options: {
  to: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendEmail({
    to: options.to,
    subject: "Your demo request",
    text: `Thank you for your interest in smartA.R.S.E.\n\nWe are unable to approve demo access for your request at this time. If you believe this is an error, please contact our team.\n\n— Disrupt Insight`,
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
