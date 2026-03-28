"use client"

import { SUPPORT_CONTACT_NEW_TAB_HREF } from "@/lib/support-contact"

export function ProjectPausedContactMessage() {
  return (
    <>
      This project is currently paused.{" "}
      <a
        href={SUPPORT_CONTACT_NEW_TAB_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-amber-950 underline decoration-amber-800/50 underline-offset-2 hover:decoration-amber-950 dark:text-amber-50 dark:decoration-amber-200/60 dark:hover:decoration-amber-100"
      >
        Contact the team
      </a>
    </>
  )
}
