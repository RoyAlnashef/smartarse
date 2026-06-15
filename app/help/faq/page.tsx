import { FaqAnswer } from "@/components/help/faq-answer"
import { faqEntries, faqIntroLead } from "@/lib/faq-content"
import { getClientSupportContactEmail } from "@/lib/support-contact-server"
import { supportContactNewTabHref } from "@/lib/support-contact"

export default async function PublicFaqPage() {
  const supportEmail = await getClientSupportContactEmail()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 font-sans text-foreground">
      <h1 className="text-2xl font-semibold">FAQ</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        {faqIntroLead}{" "}
        <a
          href={supportContactNewTabHref(supportEmail)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-arse-pink hover:underline"
        >
          Contact the Disrupt team
        </a>
        .
      </p>

      <div className="mt-10 space-y-8">
        {faqEntries.map((entry) => (
          <section key={entry.id}>
            <h2 className="text-base font-semibold">{entry.question}</h2>
            <div className="mt-2">
              <FaqAnswer entry={entry} supportEmail={supportEmail} />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
