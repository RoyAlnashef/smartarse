"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const sectionLinks = [
  { href: "/help/faq", label: "FAQ" },
  { href: "/help/privacy", label: "Privacy policy" },
  { href: "/help/contact", label: "Contact the team" },
]

export function HelpSectionNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Help sections" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-wider text-arse-black sm:text-xs">
        {sectionLinks.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={isActive ? "text-arse-magenta" : "hover:text-arse-magenta"}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
