import { cn } from "@/lib/utils"

export const pillInputClass = cn(
  "min-h-12 w-full rounded-full border-2 border-arse-pink bg-arse-white/90 px-5 py-3 text-sm text-arse-black",
  "placeholder:text-arse-black/40",
  "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
)

export const pillInputWithIconClass = cn(pillInputClass, "flex-1")

export const pillPasswordInputClass = cn(
  "min-h-12 w-full rounded-full border-2 border-arse-pink bg-arse-white/90 py-3 pl-5 pr-12 text-sm text-arse-black",
  "placeholder:text-arse-black/40",
  "focus:border-arse-black focus:outline-none focus:ring-2 focus:ring-arse-black/15"
)

export const submitButtonClass = cn(
  "inline-flex w-full items-center justify-center rounded-full border-2 border-arse-black bg-arse-pink px-4 py-3.5 text-arse-black",
  "font-arse-title text-xs font-bold uppercase tracking-wide",
  "shadow-[4px_4px_0_0_var(--arse-cyan)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-cyan)]",
  "disabled:cursor-not-allowed disabled:opacity-60"
)

export const authLinkButtonClass = cn(
  "mt-3 w-full text-center font-arse-title text-xs font-semibold uppercase tracking-[0.2em] text-arse-black/75",
  "underline decoration-arse-pink decoration-2 underline-offset-4 hover:text-arse-pink"
)
