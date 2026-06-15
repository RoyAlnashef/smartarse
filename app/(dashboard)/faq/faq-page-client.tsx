"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { FaqAnswer } from "@/components/help/faq-answer"
import { faqEntries, faqIntroLead } from "@/lib/faq-content"
import { supportContactNewTabHref } from "@/lib/support-contact"
import { cn } from "@/lib/utils"

export function FaqPageClient({ supportEmail }: { supportEmail: string }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">FAQ</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
