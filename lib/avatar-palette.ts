/**
 * Deterministic pastel background + text classes for initial avatars.
 * Seed with a stable id so colors don't flicker when labels change.
 */
const PALETTE = [
  "bg-mint-100 text-mint-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-900",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
  "bg-indigo-100 text-indigo-800",
  "bg-fuchsia-100 text-fuchsia-800",
  "bg-emerald-100 text-emerald-800",
  "bg-orange-100 text-orange-900",
  "bg-cyan-100 text-cyan-800",
  "bg-lime-100 text-lime-900",
] as const

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function initialAvatarClass(seed: string): string {
  if (!seed) return PALETTE[0]
  const idx = hashString(seed) % PALETTE.length
  return PALETTE[idx]
}
