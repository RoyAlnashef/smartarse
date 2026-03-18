"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const sectionLinks = [
  { href: "/help/faq", label: "FAQ" },
  { href: "/help/privacy", label: "Privacy policy" },
  { href: "/help/contact", label: "Contact the team" },
]

export function HelpPublicHeader() {
  const pathname = usePathname()
  // Only shown when the visitor is not signed in (see HelpLayoutHeader).
  const workspaceHref = "/"
  const workspaceLabel = "Sign in"

  return (
    <header className="border-b-4 border-arse-black bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
          <Link
            href={workspaceHref}
            className="font-serif text-xl font-bold tracking-tight text-arse-black sm:text-2xl hover:opacity-90"
            aria-label="Go to workspace"
            title="Go to workspace"
          >
            disrupt
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-arse-smart text-2xl text-arse-magenta sm:text-3xl">smart</span>
            <span className="font-arse-title text-xl font-bold tracking-[0.15em] text-arse-black sm:text-2xl">
              A.R.S.E
            </span>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href={workspaceHref}
            className="w-full rounded-full border-2 border-arse-magenta bg-arse-white/90 px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-arse-black sm:w-auto"
            title={workspaceLabel}
          >
            {workspaceLabel}
          </Link>

          <nav aria-label="Help sections">
            <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-wider text-arse-black sm:text-xs">
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
        </div>
      </div>
    </header>
  )
}

