import { getAppBaseUrl } from "@/lib/demo-access/config"
import { formatLondonCalendarDate } from "@/lib/datetime"
import {
  escapeHtml,
  renderEmailLayout,
} from "@/lib/demo-access/templates/shared"
import type { SupportNotificationProjectContext } from "@/lib/support-notifications/types"

function projectSettingsUrl(projectId: string): string {
  return `${getAppBaseUrl()}/projects/${projectId}?tab=settings&section=credits`
}

export function renderCreditBalanceLowEmail(context: SupportNotificationProjectContext): {
  subject: string
  html: string
  text: string
} {
  const balance = context.creditBalance ?? 0
  const threshold = context.creditAlertThreshold ?? 0
  const projectUrl = projectSettingsUrl(context.projectId)

  const bodyHtml = `<p style="margin:0 0 14px;">
<strong>Project:</strong> ${escapeHtml(context.projectName)}<br />
<strong>Organization:</strong> ${escapeHtml(context.organizationName)}<br />
<strong>Credit balance:</strong> ${balance.toLocaleString()}<br />
<strong>Alert threshold:</strong> ${threshold.toLocaleString()}
</p>
<p style="margin:0;"><a href="${escapeHtml(projectUrl)}" style="color:#171717;font-weight:700;">Open project credits settings</a></p>`

  const subject = `Low credits: ${context.projectName} (${balance.toLocaleString()} remaining)`
  const text = `Project "${context.projectName}" (${context.organizationName}) has dropped below the credit alert threshold.

Credit balance: ${balance.toLocaleString()}
Alert threshold: ${threshold.toLocaleString()}

Open project: ${projectUrl}`

  return {
    subject,
    html: renderEmailLayout({
      title: "Low project credits",
      intro: "A project credit balance has dropped below its configured alert threshold.",
      bodyHtml,
      footer: "You are receiving this because low-credit alerts are enabled in platform notification settings.",
    }),
    text,
  }
}

export function renderAccessExpiresEmail(
  context: SupportNotificationProjectContext,
  windowDays: 28 | 14,
): { subject: string; html: string; text: string } {
  const accessUntil = context.accessUntil ?? ""
  const daysUntil = context.daysUntilAccessEnd ?? windowDays
  const projectUrl = projectSettingsUrl(context.projectId)
  const windowLabel = windowDays === 28 ? "4 weeks" : "2 weeks"

  const bodyHtml = `<p style="margin:0 0 14px;">
<strong>Project:</strong> ${escapeHtml(context.projectName)}<br />
<strong>Organization:</strong> ${escapeHtml(context.organizationName)}<br />
<strong>Access until (London):</strong> ${escapeHtml(formatLondonCalendarDate(accessUntil))}<br />
<strong>Days remaining:</strong> ${daysUntil}
</p>
<p style="margin:0;"><a href="${escapeHtml(projectUrl)}" style="color:#171717;font-weight:700;">Open project settings</a></p>`

  const subject = `Access ends in ${windowLabel}: ${context.projectName}`
  const text = `Project "${context.projectName}" (${context.organizationName}) access ends in ${windowLabel}.

Access until (London calendar date): ${formatLondonCalendarDate(accessUntil)}
Days remaining: ${daysUntil}

Open project: ${projectUrl}`

  return {
    subject,
    html: renderEmailLayout({
      title: `Project access ends in ${windowLabel}`,
      intro: `A live project is within ${windowLabel} of its access end date (London calendar).`,
      bodyHtml,
      footer: "Dates use London calendar days, matching the platform access_until field.",
    }),
    text,
  }
}
