import { SUPPORT_CONTACT_NEW_TAB_HREF } from "@/lib/support-contact"

export default function PublicFaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 font-sans text-foreground">
      <h1 className="text-2xl font-semibold">FAQ</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Quick answers about smartA.R.S.E., projects, and how research chats use your selected documents.
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-base font-semibold">What is smartA.R.S.E.?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            smartA.R.S.E. is a project-centric workspace for organizing client research and asking questions against
            a document set (instead of searching the whole web every time).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Do I need to upload documents?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Uploading documents is the recommended way to ground answers. Once documents are added to a project, you
            can ask questions that reference the selected material.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Who can see my project?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Visibility depends on your organization and role. In general, clients and users only see projects they’re
            allowed to access.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How do credits work?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Credits act like a usage budget for chat interactions per project. The exact billing/usage model may be
            configured, but the goal is to help teams plan and control costs.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Can I delete my data?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Data management options depend on the account and admin settings. If deletion is supported for your role,
            you’ll see it in the relevant settings area.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How do I get help?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Email the team at{" "}
            <a
              href={SUPPORT_CONTACT_NEW_TAB_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-arse-pink hover:underline"
            >
              Contact the team
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
