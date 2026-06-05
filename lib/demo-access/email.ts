import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveSupportNotificationEmail } from "@/lib/support-notifications/get-recipient"
import {
  formatDemoTimestamp,
  renderEmailButton,
  renderEmailLayout,
  escapeHtml,
} from "@/lib/demo-access/templates/shared"
import { sendTransactionalEmail } from "@/lib/email/send-transactional"

async function sendEmail(options: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  internalNotification?: boolean
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendTransactionalEmail(options)
}

function formatRequesterName(
  firstName: string | null,
  lastName: string | null
): string | null {
  const parts = [firstName, lastName].map((s) => s?.trim()).filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : null
}

export async function sendDemoRequestNotificationEmail(
  admin: SupabaseClient,
  options: {
    requesterEmail: string
    firstName: string | null
    lastName: string | null
    organizationName: string | null
    requestedAt: string
    approveUrl: string
    rejectUrl: string
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = await resolveSupportNotificationEmail(admin)
  const requestedLabel = formatDemoTimestamp(options.requestedAt)
  const name =
    formatRequesterName(options.firstName, options.lastName) ?? "—"
  const organization = options.organizationName?.trim() || "—"

  const html = renderEmailLayout({
    title: "New demo request",
    intro: "A new demo access request was submitted.",
    bodyHtml: `<p style="margin:0 0 14px;"><strong>Name:</strong> ${escapeHtml(name)}<br /><strong>Email:</strong> ${escapeHtml(options.requesterEmail)}<br /><strong>Organization:</strong> ${escapeHtml(organization)}<br /><strong>Requested:</strong> ${escapeHtml(requestedLabel)}</p>
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
    text: `New demo request\n\nName: ${name}\nEmail: ${options.requesterEmail}\nOrganization: ${organization}\nRequested: ${requestedLabel}\n\nApprove: ${options.approveUrl}\nReject: ${options.rejectUrl}`,
    internalNotification: true,
  })
}

export async function sendDemoMagicLinkEmail(options: {
  to: string
  magicLink: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const html = renderEmailLayout({
    title: "Your Disrupt demo access",
    intro:
      "Your demo access to smartA.R.S.E. has been approved. Use the link below to activate your account and set a password.",
    bodyHtml: `<p style="margin:0 0 12px;">${renderEmailButton(options.magicLink, "Set up your password", "primary")}</p>
<p style="margin:0;font-size:14px;color:#444;">After you create a password, sign in anytime with your email and password.</p>`,
    footer:
      "This activation link expires in about 24 hours. If it expires, contact the team to request a new link.",
  })

  return sendEmail({
    to: options.to,
    subject: "Your Disrupt - smartA.R.S.E. demo access",
    html,
    text: `Your demo access to smartA.R.S.E. has been approved.\n\nActivate demo access and set your password: ${options.magicLink}\n\nThis link expires in about 24 hours. After setup, sign in with your email and password.`,
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
