import { notFound } from "next/navigation"
import { EmailPreviewClient } from "@/app/dev/emails/email-preview-client"
import { getAllEmailPreviews } from "@/lib/email/preview/samples"

export default function DevEmailsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  const previews = getAllEmailPreviews()

  return <EmailPreviewClient previews={previews} initialId={previews[0]?.id ?? ""} />
}
