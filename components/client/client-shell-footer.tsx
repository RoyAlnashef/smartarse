import Link from "next/link"

export function ClientShellFooter() {
  return (
    <footer className="mt-auto border-t-2 border-arse-black/10 bg-white px-4 py-6 sm:px-8">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 font-arse-body text-[10px] font-semibold uppercase tracking-wider text-arse-black sm:text-xs">
        <span className="text-arse-black/30">|</span>
        <Link href="/help/faq" className="hover:text-arse-magenta">
          FAQ
        </Link>
        <span className="text-arse-black/30">|</span>
        <Link href="/help/privacy" className="hover:text-arse-magenta">
          Privacy policy
        </Link>
        <span className="text-arse-black/30">|</span>
        <Link href="/help/contact" className="hover:text-arse-magenta">
          Contact the team
        </Link>
      </nav>
    </footer>
  )
}
