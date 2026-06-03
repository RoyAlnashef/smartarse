import { Resend } from "resend"
import {
  extractEmailAddress,
  getEmailProviderApiKey,
  getFromAddressForRecipients,
  getTransactionalReplyToAddress,
  isSameMailbox,
  isSupportNotificationRecipient,
} from "@/lib/demo-access/config"

function getResendClient(): Resend | null {
  const apiKey = getEmailProviderApiKey()
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function sendTransactionalEmail(options: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const from = getFromAddressForRecipients(options.to)
  const replyTo = getTransactionalReplyToAddress()
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: "Email is not configured." }
  }

  const recipients = Array.isArray(options.to) ? options.to : [options.to]
  if (
    process.env.NODE_ENV === "development" &&
    recipients.some(
      (to) =>
        isSupportNotificationRecipient(to) &&
        isSameMailbox(extractEmailAddress(from), to),
    )
  ) {
    console.warn(
      "[email] From and To use the same mailbox; forwarding rules may not run.",
      { from, to: options.to },
    )
  }

  const { error } = await resend.emails.send({
    from,
    to: options.to,
    replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
