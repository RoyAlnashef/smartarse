"use client"

import Link from "next/link"

import { supportMailtoHref } from "@/lib/support-contact"
import { useSupportContactEmail } from "@/lib/support-contact-context"

const HELP_LINKS = [
  { href: "/help/faq", label: "FAQ" },
  { href: "/help/privacy", label: "Privacy" },
  { href: "/help/terms", label: "Terms" },
  { href: "/help/cookies", label: "Cookies" },
] as const

export function LegalFooterNav({
  linkTarget = "_self",
}: {
  linkTarget?: "_blank" | "_self"
}) {
  const supportEmail = useSupportContactEmail()
  const openInNewTab = linkTarget === "_blank"

  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
      {HELP_LINKS.map((link, index) => (
        <span key={link.href} className="contents">
          {index === 0 ? <span className="text-arse-black/40">|</span> : null}
          <Link
            href={link.href}
            {...(openInNewTab
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="hover:text-arse-pink"
          >
            {link.label}
          </Link>
          <span className="text-arse-black/40">|</span>
        </span>
      ))}
      <a
        href={supportMailtoHref(supportEmail)}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-arse-pink"
      >
        Contact the team
      </a>
    </nav>
  )
}
