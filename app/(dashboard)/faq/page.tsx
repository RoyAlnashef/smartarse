"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { faqItems } from "@/lib/mock-data"

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null)

  const categories = Array.from(new Set(faqItems.map((f) => f.category)))

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find answers to common questions about using the platform
        </p>
      </div>

      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {faqItems
              .filter((f) => f.category === category)
              .map((faq) => {
                const isOpen = openId === faq.id
                return (
                  <div key={faq.id}>
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between px-6 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </section>
      ))}
    </div>
  )
}
