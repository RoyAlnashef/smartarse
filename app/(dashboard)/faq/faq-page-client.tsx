"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  SUPPORT_CONTACT_NEW_TAB_HREF,
  supportMailtoHref,
} from "@/lib/support-contact"
import { cn } from "@/lib/utils"

type FaqEntry = {
  id: string
  question: string
  paragraphs?: string[]
  orderedList?: string[]
  trailingParagraph?: string
}

const faqEntries: FaqEntry[] = [
  {
    id: "what-is",
    question: "What is smartA.R.S.E.?",
    paragraphs: [
      "SmartA.R.S.E. is a project-centric AI agent for interrogating and summarising the insight from your project sitting within a secure and closed environment.",
    ],
  },
  {
    id: "what-can-i-ask",
    question: "What can I ask SmartA.R.S.E.?",
    paragraphs: [
      "You can ask SmartA.R.S.E. anything to do with your project, be that creating summaries, finding specific subgroup stats or pulling quotes on a topic. Be creative! SmartA.R.S.E. has been trained to only answer questions pertinent to your project. If you ask something not relevant to your project, it will tell you it can't answer it. If it cannot find an answer, it will not make one up.",
    ],
  },
  {
    id: "answers-based-on",
    question: "What are smartA.R.S.E. answers based on?",
    paragraphs: [
      "The seed data is always project specific and shown in the sources window of the project page. Inputs can be of 3 key forms:",
    ],
    orderedList: [
      "Reports – these can be final or interim reports written by Disrupt in PowerPoint, Word or PDF",
      "Raw quantitative data – Excel based respondent level raw data as you would typically export from survey platforms",
      "Qualitative inputs – Full transcripts from any form of qual research (groups, IDI's etc). All transcripts are uploaded in full, including the moderator questions and meta data tagged as required e.g. respondent age, gender, etc.",
    ],
    trailingParagraph:
      "The exact inputs will be confirmed with the Disrupt team and can be any combination or number of the above forms. There is no external inputs beyond your specific project data.",
  },
  {
    id: "how-it-works",
    question: "How does smartA.R.S.E. work?",
    paragraphs: [
      "smartA.R.S.E. isn't just any old AI. We've built an analysis heuristic grounded in our favourite BeSci and behavioural change frameworks; meaning all responses are shaped through the lens of the bespoke Disrupt reports created for your project. Human written headings, summaries and recommendations all feed into the answers smartA.R.S.E gives you.",
    ],
  },
  {
    id: "accuracy",
    question: "How accurate is smartA.R.S.E.?",
    paragraphs: [
      "smartA.R.S.E. is 100% accurate. It is not making predictions nor is it an AI persona representation of your audience. It is synthesising and summarising the data and insights from your project and presenting these facts back.",
    ],
  },
  {
    id: "hallucinate",
    question: "Will smartA.R.S.E. hallucinate?",
    paragraphs: [
      "No! Our AI has been created with detailed guardrails to prevent hallucinations. If you ask something it cannot answer from the seed data, it will tell you it cannot answer it. It will not make anything up.",
    ],
  },
  {
    id: "personas",
    question: "What are the personas and how do I use them?",
    paragraphs: [
      "Personas in smartA.R.S.E. are a way to talk to the collective representation of an audience within the project i.e. if you wanted to understand the views of a specific subgroup or country this is where you go to do it. The pre-set personas are built to the spec agreed with Disrupt but you can use the custom audience feature to build your own bespoke subgroup to talk to and save it for next time (up to 3 custom audiences can be saved).",
    ],
  },
  {
    id: "focus-group",
    question: "What is the focus group feature?",
    paragraphs: [
      "Here you can start a debate between the different AI Personas on whatever topic is relevant to you? You ask a question or set a topic and the personas will take it in turn to debate/ answer your query.",
    ],
  },
  {
    id: "who-can-see",
    question: "Who can see my project?",
    paragraphs: [
      "Access to your project(s) is strictly limited to the people you asked to have access during setup. If you need to add people to your project at a later date, please speak to your Disrupt team.",
    ],
  },
  {
    id: "data-secure",
    question: "Is my data secure?",
    paragraphs: [
      "Yes. It is held on a private and secure server in the UK. Your data is not accessible by other AI agents and is not used to train any AI models.",
    ],
  },
  {
    id: "extend-access",
    question: "Can I extend the access to my projects?",
  },
  {
    id: "past-conversations",
    question: "I can't find things I asked in the past?",
    paragraphs: [
      "All past conversations are saved in the chat history which can be accessed via the main project window. Each session is saved as a single conversation, if you are looking for a specific question you will need to open that specific session. You can start new chats to have conversations saved into different histories.",
    ],
  },
  {
    id: "ai-model",
    question: "What AI model does smartA.R.S.E use?",
    paragraphs: [
      "SmartA.R.S.E. is built on the very latest Anthropic models and kept up to date with the latest AI developments.",
    ],
  },
  {
    id: "crossbreaks",
    question: "Can smartA.R.S.E be used to make crossbreaks/ data tables?",
    paragraphs: [
      "Yes and no. smartA.R.S.E. can make small summary tables and you can add key subgroups as cross breaks. It is not meant to be a full crosstab tool and does not replicate the functionality of tailored crosstab programmes. If you need to slice and dice your data in this way reach out to your Disrupt project team.",
    ],
  },
]

function FaqAnswer({
  entry,
  supportEmail,
}: {
  entry: FaqEntry
  supportEmail: string
}) {
  if (entry.id === "extend-access") {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Yes,{" "}
        <a
          href={supportMailtoHref(supportEmail)}
          className="font-semibold text-arse-pink hover:underline"
        >
          contact the Disrupt team
        </a>{" "}
        to extend access if required.
      </p>
    )
  }

  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      {entry.paragraphs?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {entry.orderedList && (
        <ol className="list-decimal space-y-1 pl-5">
          {entry.orderedList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
      {entry.trailingParagraph && <p>{entry.trailingParagraph}</p>}
    </div>
  )
}

export function FaqPageClient({ supportEmail }: { supportEmail: string }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">FAQ</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          For quick answers about smartA.R.S.E., and how best chat to your project. If you
          can't find what you're looking for?{" "}
          <a
            href={SUPPORT_CONTACT_NEW_TAB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-arse-pink hover:underline"
          >
            Contact the Disrupt team
          </a>
          .
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        {faqEntries.map((faq) => {
          const isOpen = openId === faq.id
          return (
            <div
              key={faq.id}
              className="w-full rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border px-6 pb-4 pt-4">
                  <FaqAnswer entry={faq} supportEmail={supportEmail} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
