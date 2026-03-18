"use client"

import Link from "next/link"

export function HelpPublicHeader() {
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

        <Link
          href={workspaceHref}
          className="w-full rounded-full border-2 border-arse-magenta bg-arse-white/90 px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-arse-black sm:w-auto lg:shrink-0"
          title={workspaceLabel}
        >
          {workspaceLabel}
        </Link>
      </div>
    </header>
  )
}

