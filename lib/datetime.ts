/** IANA zone for automated business rules (access expiry, notification triggers). */
export const BUSINESS_TIMEZONE = "Europe/London" as const

/** Locale for user-facing date/time display (browser local timezone). */
export const DISPLAY_LOCALE = "en-GB" as const

const londonCalendarFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/** Calendar day in London as `YYYY-MM-DD`. */
export function londonCalendarDateString(d: Date = new Date()): string {
  return londonCalendarFormatter.format(d)
}

/** Whole days from today (London `YYYY-MM-DD`) until `ymd`; negative if in the past. */
export function londonCalendarDaysUntil(ymd: string): number {
  const today = londonCalendarDateString()
  const a = new Date(`${today}T12:00:00.000Z`).getTime()
  const b = new Date(`${ymd}T12:00:00.000Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Format a stored `YYYY-MM-DD` calendar date for support emails (no timezone shift). */
export function formatLondonCalendarDate(
  ymd: string,
  style: "short" | "long" = "long"
): string {
  const [year, month, day] = ymd.split("-").map(Number)
  const anchor = new Date(Date.UTC(year, month - 1, day, 12))
  return anchor.toLocaleDateString(DISPLAY_LOCALE, {
    dateStyle: style,
    timeZone: "UTC",
  })
}

export function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(DISPLAY_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatLocalDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  return new Date(iso).toLocaleDateString(DISPLAY_LOCALE, options)
}

export function formatLocalDateTime(iso: string): string {
  return new Date(iso).toLocaleString(DISPLAY_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function isLocalToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

/** Format stored `YYYY-MM-DD` as dd/MM/yyyy without timezone conversion. */
export function formatCalendarDateLocal(ymd: string): string {
  const [year, month, day] = ymd.split("-")
  if (!year || !month || !day) return ymd
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}
