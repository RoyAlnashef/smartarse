export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Introduction",
      content:
        "Disrupt Insight Ltd (\"Disrupt\", \"we\", \"us\") is committed to protecting the privacy and security of your personal data. This policy outlines how we collect, use, store, and protect information when you use our AI Research Assistant platform.",
    },
    {
      title: "2. Data We Collect",
      content:
        "We collect the following categories of data: account information (name, email, organisation), uploaded research documents and datasets, chat queries and AI-generated responses, usage analytics (query counts, login times, feature usage), and technical data (IP address, browser type, device information).",
    },
    {
      title: "3. How We Use Your Data",
      content:
        "Your data is used to: provide and maintain the AI Research Assistant service, process your natural language queries against uploaded documents, generate usage analytics and reports for your organisation, improve our AI models and service quality, and communicate service updates and support information.",
    },
    {
      title: "4. Data Storage & Security",
      content:
        "All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. Each client's data is logically isolated in separate secure environments. We maintain SOC 2 Type II compliance and undergo regular third-party security audits. Data is stored in UK-based data centres operated by our cloud infrastructure partner.",
    },
    {
      title: "5. Data Retention",
      content:
        "Uploaded documents and chat histories are retained for the duration of your active subscription. Upon account termination, all data is permanently deleted within 30 days. You may request earlier deletion at any time by contacting your account manager.",
    },
    {
      title: "6. Your Rights Under GDPR",
      content:
        "Under the UK General Data Protection Regulation (UK GDPR), you have the right to: access your personal data, rectify inaccurate data, erase your data (right to be forgotten), restrict processing of your data, data portability, and object to processing. To exercise any of these rights, please contact our Data Protection Officer at dpo@disrupt-insight.com.",
    },
    {
      title: "7. Third-Party Processors",
      content:
        "We use carefully selected third-party processors to deliver our service, including cloud infrastructure providers, AI model providers, and analytics services. All third parties are bound by data processing agreements that meet GDPR requirements.",
    },
    {
      title: "8. Changes to This Policy",
      content:
        "We may update this policy from time to time. We will notify you of any material changes via email or through an in-platform notification. The current version will always be available on this page.",
    },
    {
      title: "9. Contact Us",
      content:
        "If you have any questions about this privacy policy or our data practices, please contact us at: Disrupt Insight Ltd, Data Protection Officer, Email: dpo@disrupt-insight.com.",
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Data Protection Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last updated: 1 February 2026
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
