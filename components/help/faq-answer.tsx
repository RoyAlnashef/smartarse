import { type FaqEntry } from "@/lib/faq-content"
import { supportMailtoHref } from "@/lib/support-contact"

export function FaqAnswer({
  entry,
  supportEmail,
  className = "text-sm leading-relaxed text-muted-foreground",
}: {
  entry: FaqEntry
  supportEmail: string
  className?: string
}) {
  if (entry.id === "extend-access") {
    return (
      <p className={className}>
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
    <div className={`space-y-2 ${className}`}>
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
