import Link from "next/link"

export function ClientShellFooter() {
  return (
    <footer className="mt-auto flex w-full flex-col items-center justify-between gap-3 border-t-2 border-arse-black/10 bg-white px-4 py-6 font-arse-body text-[10px] font-medium uppercase tracking-wider text-arse-black sm:flex-row sm:px-8 sm:text-xs">
      <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
        <span className="text-arse-black/40">|</span>
        <Link href="/help/faq" className="hover:text-arse-pink">
          FAQ
        </Link>
        <span className="text-arse-black/40">|</span>
        <Link href="/help/privacy" className="hover:text-arse-pink">
          Privacy policy
        </Link>
        <span className="text-arse-black/40">|</span>
        <Link href="/help/contact" className="hover:text-arse-pink">
          Contact the team
        </Link>
      </nav>
      <p className="shrink-0 text-arse-black/70">
        © Disrupt Insight {new Date().getFullYear()}
      </p>
    </footer>
  )
}
