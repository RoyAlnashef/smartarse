/** Normalise smart quotes and dashes before sending `chatInput` to the n8n webhook. */
export function sanitiseQuery(input: string): string {
  return input
    .replace(/[\u201C\u201D\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201B\u2032\u2035]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .trim()
}
