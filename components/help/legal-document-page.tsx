import Link from "next/link"

import { DPO_EMAIL, ICO_URL } from "@/lib/legal/constants"
import type { LegalDocument } from "@/lib/legal/types"

function renderTextWithLinks(text: string) {
  const dpoPattern = DPO_EMAIL
  const icoPattern = ICO_URL

  if (text.includes(dpoPattern)) {
    const parts = text.split(dpoPattern)
    return (
      <>
        {parts[0]}
        <a
          href={`mailto:${DPO_EMAIL}`}
          className="font-semibold text-arse-pink hover:underline"
        >
          {DPO_EMAIL}
        </a>
        {parts[1]}
      </>
    )
  }

  if (text.includes(icoPattern)) {
    const parts = text.split(icoPattern)
    return (
      <>
        {parts[0]}
        <a
          href={ICO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-arse-pink hover:underline"
        >
          {ICO_URL}
        </a>
        {parts[1]}
      </>
    )
  }

  return text
}

function LegalSectionBlock({ section }: { section: LegalDocument["sections"][number] }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{section.title}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-2 text-muted-foreground leading-relaxed">
          {renderTextWithLinks(paragraph)}
        </p>
      ))}
      {section.listItems ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground leading-relaxed">
          {section.listItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.subsections?.map((subsection) => (
        <div key={subsection.title || subsection.paragraphs?.[0]} className="mt-4">
          {subsection.title ? (
            <h3 className="text-sm font-semibold text-foreground">{subsection.title}</h3>
          ) : null}
          {subsection.paragraphs?.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-2 text-muted-foreground leading-relaxed"
            >
              {renderTextWithLinks(paragraph)}
            </p>
          ))}
          {subsection.listItems ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground leading-relaxed">
              {subsection.listItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  )
}

export function LegalDocumentPage({
  document,
  lastUpdated,
  version,
}: {
  document: LegalDocument
  lastUpdated: string
  version: string
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 font-sans text-foreground">
      {document.documentControl ? (
        <div className="mb-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Document Control</p>
          <p className="mt-1">Version: {document.documentControl.version}</p>
          <p>Date: {document.documentControl.date}</p>
        </div>
      ) : null}

      <h1 className="text-2xl font-semibold">{document.title}</h1>
      {document.subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{document.subtitle}</p>
      ) : null}

      {document.intro?.map((paragraph) => (
        <p key={paragraph} className="mt-4 text-muted-foreground leading-relaxed">
          {paragraph.includes("Privacy Policy") ? (
            <>
              {paragraph.split("Privacy Policy")[0]}
              <Link href="/help/privacy" className="font-semibold text-arse-pink hover:underline">
                Privacy Policy
              </Link>
              {paragraph.split("Privacy Policy")[1]}
            </>
          ) : (
            paragraph
          )}
        </p>
      ))}

      <div className="mt-10 space-y-8">
        {document.sections.map((section) => (
          <LegalSectionBlock key={section.title} section={section} />
        ))}

        {document.table ? (
          <section>
            <h2 className="text-base font-semibold">{document.table.title}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {document.table.columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-3 py-2 font-semibold text-foreground"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {document.table.rows.map((row) => (
                    <tr key={row.name} className="border-b border-border/60 align-top">
                      {document.table!.columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-3 py-2 text-muted-foreground"
                        >
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {document.table.footnotes?.map((note) => (
              <p key={note} className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {note}
              </p>
            ))}
          </section>
        ) : null}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Last updated {lastUpdated} v{version}
      </p>
    </div>
  )
}
