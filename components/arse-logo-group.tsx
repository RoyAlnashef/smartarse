export type ArseLogoGroupProps = {
  /** Full page wordmark (login, project list). `inline` matches the client shell header cluster. */
  variant?: "default" | "inline"
  /** When false, the tagline paragraph is omitted. */
  showTagline?: boolean
  className?: string
}

export function ArseLogoGroup({
  variant = "default",
  showTagline = true,
  className,
}: ArseLogoGroupProps) {
  const WordmarkTag = variant === "inline" ? "div" : "h1"

  const wordmarkClass =
    variant === "inline"
      ? // Tight smart→A.R.S.E spacing; baseline pairs script + sans like the default lockup.
        "flex flex-row items-baseline gap-1 sm:gap-1.5 leading-none"
      : "flex flex-row gap-3 items-baseline leading-none"

  const smartClass =
    variant === "inline"
      ? "font-arse-smart text-arse-pink leading-none text-[2.25rem] sm:text-[2.5rem]"
      : "font-arse-smart text-arse-pink leading-[3rem] sm:leading-[3.75rem] text-7xl sm:text-8xl"

  const arseClass =
    variant === "inline"
      ? "font-arse-title font-normal tracking-[0.12em] text-arse-black leading-none text-[1.5625rem] sm:text-[1.75rem]"
      : "font-arse-title font-normal tracking-[0.12em] text-arse-black leading-none text-5xl sm:text-6xl"

  const taglineEl = showTagline ? (
    <p className="font-arse-title w-full text-xs font-semibold uppercase text-arse-black sm:text-sm text-justify [text-align-last:justify] [text-justify:inter-character]">
      Agentic research search engine
    </p>
  ) : null

  const wordmark = (
    <WordmarkTag className={wordmarkClass}>
      <span className={smartClass}>smart</span>
      <span className={arseClass}>A.R.S.E</span>
    </WordmarkTag>
  )

  if (variant === "inline") {
    return (
      <>
        {wordmark}
        {taglineEl}
      </>
    )
  }

  return (
    <div className={className}>
      {wordmark}
      {taglineEl}
    </div>
  )
}
