import { getAppBaseUrl } from "@/lib/demo-access/config"
import {
  escapeHtml,
  renderEmailButton,
  renderEmailButtonRow,
  renderEmailLayout,
  supabaseConfirmLink,
} from "@/lib/email"
import { renderAccessExpiresEmail, renderCreditBalanceLowEmail } from "@/lib/support-notifications/templates"
import { supabaseAuthEmailTemplates } from "@/lib/email/supabase"

const SAMPLE_BASE = getAppBaseUrl()
const SAMPLE_TOKEN = "sample-token-hash-for-preview"

function formatDemoTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function previewSupabaseLink(type: string, nextPath: string): string {
  return `${SAMPLE_BASE}/auth/confirm?token_hash=${SAMPLE_TOKEN}&type=${type}&next=${nextPath}`
}

export type EmailPreviewEntry = {
  id: string
  label: string
  category: "app" | "supabase"
  subject: string
  html: string
  supabaseHtml?: string
}

function renderDemoRequestPreview(): EmailPreviewEntry {
  const requestedAt = "2026-05-29T01:31:00.000Z"
  const requestedLabel = formatDemoTimestamp(requestedAt)

  return {
    id: "demo-request",
    label: "Demo request (internal)",
    category: "app",
    subject: "New smartA.R.S.E. demo request from alex@example.com",
    html: renderEmailLayout({
      title: "New demo request",
      intro: "A new demo access request was submitted.",
      bodyHtml: `<p style="margin:0 0 14px;"><strong>Name:</strong> ${escapeHtml("Alex Morgan")}<br /><strong>Email:</strong> ${escapeHtml("alex@example.com")}<br /><strong>Organization:</strong> ${escapeHtml("Example Research Ltd")}<br /><strong>Requested:</strong> ${escapeHtml(requestedLabel)}</p>
<p style="margin:0;">${renderEmailButtonRow([
        { href: `${SAMPLE_BASE}/api/demo/approve?token=sample`, label: "Approve", variant: "primary" },
        { href: `${SAMPLE_BASE}/api/demo/reject?token=sample`, label: "Reject", variant: "secondary" },
      ])}</p>`,
      footer: "Links expire after the configured approval window.",
    }),
  }
}

function renderDemoMagicLinkPreview(): EmailPreviewEntry {
  return {
    id: "demo-magic-link",
    label: "Demo magic link (prospect)",
    category: "app",
    subject: "Your Disrupt - smartA.R.S.E. demo access",
    html: renderEmailLayout({
      title: "Your Disrupt demo access",
      intro:
        "Your demo access to smartA.R.S.E. has been approved. Use the link below to activate your account and set a password.",
      bodyHtml: `<p style="margin:0 0 12px;">${renderEmailButton(previewSupabaseLink("magiclink", "/auth/demo-setup"), "Set up your password", "primary")}</p>
<p style="margin:0;font-size:14px;color:#444;">After you create a password, sign in anytime with your email and password.</p>`,
      footer:
        "This activation link expires in about 24 hours. If it expires, contact the team to request a new link.",
    }),
  }
}

function renderDemoRejectionPreview(): EmailPreviewEntry {
  return {
    id: "demo-rejection",
    label: "Demo rejection (prospect)",
    category: "app",
    subject: "Your Disrupt - smartA.R.S.E. demo access",
    html: renderEmailLayout({
      title: "Your demo request",
      intro: "Thank you for your interest in smartA.R.S.E.",
      bodyHtml:
        '<p style="margin:0;">We are unable to approve demo access at this time. If you believe this is an error, please contact the team.</p>',
      footer: "You can submit a new request at any time from the demo access page.",
    }),
  }
}

function renderLowCreditsPreview(): EmailPreviewEntry {
  const { subject, html } = renderCreditBalanceLowEmail({
    projectId: "00000000-0000-0000-0000-000000000001",
    projectName: "smartA.R.S.E. Demo",
    organizationName: "smartA.R.S.E. Demo Org",
    creditBalance: 720,
    creditAlertThreshold: 722,
  })

  return {
    id: "low-credits",
    label: "Low project credits (internal)",
    category: "app",
    subject,
    html,
  }
}

function renderAccessExpiresPreview(windowDays: 28 | 14): EmailPreviewEntry {
  const { subject, html } = renderAccessExpiresEmail(
    {
      projectId: "00000000-0000-0000-0000-000000000001",
      projectName: "smartA.R.S.E. Demo",
      organizationName: "smartA.R.S.E. Demo Org",
      creditBalance: 5000,
      creditAlertThreshold: 500,
      accessUntil: "2026-07-15",
      daysUntilAccessEnd: windowDays,
    },
    windowDays,
  )

  return {
    id: windowDays === 28 ? "access-expires-28d" : "access-expires-14d",
    label: `Access expires in ${windowDays === 28 ? "4 weeks" : "2 weeks"} (internal)`,
    category: "app",
    subject,
    html,
  }
}

function substituteSupabaseVars(html: string): string {
  return html
    .replace(/\{\{\s*\.SiteURL\s*\}\}/g, SAMPLE_BASE)
    .replace(/\{\{\s*\.TokenHash\s*\}\}/g, SAMPLE_TOKEN)
}

function renderSupabasePreview(
  template: (typeof supabaseAuthEmailTemplates)[number],
): EmailPreviewEntry {
  return {
    id: `supabase-${template.id}`,
    label: `Supabase: ${template.label}`,
    category: "supabase",
    subject: template.subject,
    html: substituteSupabaseVars(template.html),
    supabaseHtml: template.html,
  }
}

export function getAllEmailPreviews(): EmailPreviewEntry[] {
  const appPreviews = [
    renderDemoRequestPreview(),
    renderDemoMagicLinkPreview(),
    renderDemoRejectionPreview(),
    renderLowCreditsPreview(),
    renderAccessExpiresPreview(28),
    renderAccessExpiresPreview(14),
  ]

  const supabasePreviews = supabaseAuthEmailTemplates.map(renderSupabasePreview)

  return [...appPreviews, ...supabasePreviews]
}

export function getEmailPreviewById(id: string): EmailPreviewEntry | undefined {
  return getAllEmailPreviews().find((entry) => entry.id === id)
}
