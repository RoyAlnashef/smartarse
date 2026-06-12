import { FaqPageClient } from "@/app/(dashboard)/faq/faq-page-client"
import { getClientSupportContactEmail } from "@/lib/support-contact-server"

export default async function FAQPage() {
  const supportEmail = await getClientSupportContactEmail()

  return <FaqPageClient supportEmail={supportEmail} />
}
