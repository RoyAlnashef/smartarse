import { getClientSupportContactEmail } from "@/lib/support-contact-server"
import { supportContactNewTabHref } from "@/lib/support-contact"

export default async function PublicFaqPage() {
  const supportEmail = await getClientSupportContactEmail()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 font-sans text-foreground">
      <h1 className="text-2xl font-semibold">FAQ</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Quick answers about smartA.R.S.E., and how to use it to best use the chat. If you can’t find what you’re
        looking for?{" "}
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
        <section>
          <h2 className="text-base font-semibold">What is smartA.R.S.E.?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            smartA.R.S.E. is a project-centric AI agent for interrogating and summarising the insight from your
            project sitting within a secure and closed environment.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">What can I ask smartA.R.S.E.?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            You can ask smartA.R.S.E. anything to do with your project, be that creating summaries, finding specific
            subgroup stats or pulling quotes on a topic. Be creative! smartA.R.S.E. has been trained to only answer
            questions pertinent to your project. If you ask something not relevant to your project, it will tell you
            it can’t answer it. If it cannot find an answer, it will not make one up.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">What are smartA.R.S.E. answers based on?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            The seed data is always project specific and shown in the sources window of the project page. Inputs can
            be of 3 key forms:
          </p>
          <ol className="mt-2 list-decimal pl-5 text-muted-foreground leading-relaxed space-y-1">
            <li>
              Reports - these can be final or interim reports written by Disrupt in PowerPoint, Word or PDF
            </li>
            <li>
              Raw quantitative data - Excel based respondent level raw data as you would typically export from survey
              platforms
            </li>
            <li>
              Qualitative inputs - Full transcripts from any form of qual research (groups, IDI’s etc). All transcripts
              are uploaded in full, including the moderator questions and meta data tagged as required e.g. respondent
              age, gender, etc.
            </li>
          </ol>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            The exact inputs will be confirmed with the Disrupt team and can be any combination or number of the above
            forms. There is no external inputs beyond your specific project data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How does smartA.R.S.E. work?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            smartA.R.S.E. isn’t just any old AI. We’ve built an analysis heuristic grounded in our favourite BeSci and
            behavioural change frameworks; meaning all responses are shaped through the lens of the bespoke Disrupt
            reports created for your project. Human written headings, summaries and recommendations all feed into the
            answers smartA.R.S.E gives you.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How accurate is smartA.R.S.E.?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            smartA.R.S.E. is 100% accurate. It is not making predictions nor is it an AI persona representation of
            your audience. It is synthesising and summarising the data and insights from your project and presenting
            these facts back.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Will smartA.R.S.E. hallucinate?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            No! Our AI has been created with detailed guardrails to prevent hallucinations. If you ask something it
            cannot answer from the seed data, it will tell you it cannot answer it. It will not make anything up.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">What are the personas and how do I use them?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Personas in smartA.R.S.E. are a way to talk to the collective representation of an audience within the
            project i.e. if you wanted to understand the views of a specific subgroup or country this is where you go
            to do it. The pre-set personas are built to the spec agreed with Disrupt but you can use the custom
            audience feature to build your own bespoke subgroup to talk to and save it for next time (up to 3 custom
            audiences can be saved).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">What is the focus group feature?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Here you can start a debate between the different AI Personas on whatever topic is relevant to you? You ask
            a question or set a topic and the personas will take it in turn to debate/ answer your query.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Who can see my project?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Access to your project(s) is strictly limited to the people you asked to have access during setup. If you
            need to add people to your project at a later date, please speak to your Disrupt team.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Is my data secure?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Yes. It is held on a private and secure server in the UK. Your data is not accessible by other AI agents
            and is not used to train any AI models.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Can I extend the access to my projects?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Yes, please ask the Disrupt team to extend access if required.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">I can’t find things I asked in the past?</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            All past conversations are saved in the chat history which can be accessed via the main project window.
            Each session is saved as a single conversation, if you are looking for a specific question you will need to
            open that specific session. You can start new chats to have conversations saved into different histories.
          </p>
        </section>
      </div>
    </div>
  )
}
