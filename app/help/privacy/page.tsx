export default function PublicPrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 font-sans text-foreground">
      <h1 className="text-2xl font-semibold">Privacy policy</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        A plain-language summary of how smartA.R.S.E. handles data while you organize projects and ask questions
        against your selected documents.
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-base font-semibold">What information do you collect?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We store account details and project-related information you provide. When you upload documents, we store
            associated metadata and use the content to support research questions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How do we use this information?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We use your data to run the workspace, provide chat answers grounded in selected documents, and secure
            the system. We may also use limited telemetry (for example, operational logs) to maintain reliability.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Do we share data?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We may share data with service providers that help operate the platform (for example, hosting and storage).
            We avoid selling personal information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Data retention and deletion</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We keep data while it’s needed to provide the service and for legitimate operational purposes. Deletion
            requests and retention settings depend on your role and configuration.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Security</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We use reasonable security measures to protect data. While no system is perfectly secure, we aim to reduce
            risk through access controls and secure infrastructure practices.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Your choices and rights</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Depending on your location and role, you may have rights to access or request deletion of certain data. For
            help with privacy requests, contact the team.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact us</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            For privacy questions, visit{" "}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=smart-arse@disrupt-insight.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-arse-pink hover:underline"
            >
              Contact the team
            </a>
            .
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            This page is a summary for the current MVP and is not legal advice.
          </p>
        </section>
      </div>
    </div>
  )
}
