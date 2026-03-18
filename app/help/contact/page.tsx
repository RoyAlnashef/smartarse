export default function PublicContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 font-sans text-foreground">
      <h1 className="text-2xl font-semibold">Contact the team</h1>
      <p className="mt-4 text-muted-foreground">
        Questions about smartA.R.S.E.? Email us and we’ll get back to you.
      </p>

      <div className="mt-8 rounded-lg border border-foreground/10 bg-white/70 p-6">
        <p className="text-sm font-medium text-foreground">Email</p>
        <p className="mt-2 text-base">
          <a
            href="mailto:support@disrupt-insight.com?subject=smartA.R.S.E.%20Help%20Request"
            className="font-semibold text-arse-magenta hover:underline"
          >
            support@disrupt-insight.com
          </a>
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Tip: include what you were trying to do and any relevant screenshots.
        </p>
      </div>
    </div>
  )
}

