import { LegalFooterNav } from "@/components/legal/legal-footer-nav"

export function ClientShellFooter() {
  return (
    <footer className="mt-auto flex w-full flex-col items-center justify-between gap-3 border-t-2 border-arse-black/10 bg-white px-4 py-6 font-arse-body text-[10px] font-medium uppercase tracking-wider text-arse-black sm:flex-row sm:px-8 sm:text-xs">
      <LegalFooterNav linkTarget="_blank" />
      <p className="shrink-0 text-arse-black/70">
        © Disrupt Insight {new Date().getFullYear()}
      </p>
    </footer>
  )
}
