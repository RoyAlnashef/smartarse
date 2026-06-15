"use client"

import { supportMailtoHref } from "@/lib/support-contact"
import { useSupportContactEmail } from "@/lib/support-contact-context"

export function ProjectPausedContactMessage() {
  const supportEmail = useSupportContactEmail()

  return (
    <>
      This project is currently paused.{" "}
      <a
        href={supportMailtoHref(supportEmail)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-amber-950 underline decoration-amber-800/50 underline-offset-2 hover:decoration-amber-950 dark:text-amber-50 dark:decoration-amber-200/60 dark:hover:decoration-amber-100"
      >
        Contact the team
      </a>
    </>
  )
}
