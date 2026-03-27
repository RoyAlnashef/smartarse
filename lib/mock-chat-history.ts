import type { HistoryItem } from "@/lib/chat-history-types"

/** Snapshot at module load so IDs stay stable and grouping stays consistent for the session. */
const now = Date.now()
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString()

const MINUTE = 60 * 1000
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * Mock past questions for Chat History sidebar UI (replace with GET /api/chat/history later).
 * Mix of short and long `user_query` strings to exercise `line-clamp-2`; dates span today, yesterday, and older weeks.
 */
export const MOCK_CHAT_HISTORY: HistoryItem[] = [
  {
    id: 101,
    user_query: "What moved NPS most in the UK retail cohort last quarter?",
    created_at: iso(-45 * MINUTE),
    status: "complete",
  },
  {
    id: 102,
    user_query:
      "Compare verbatim themes between promoters and detractors for the sustainability messaging wave — include anything on price, delivery, and product quality with example quotes if the base allows.",
    created_at: iso(-3 * HOUR),
    status: "complete",
  },
  {
    id: 103,
    user_query: "Quick read: did weighted vs unweighted scores change the headline?",
    created_at: iso(-6 * HOUR),
    status: "complete",
  },
  {
    id: 104,
    user_query:
      "Surface any emerging risks in open ends tagged ‘support’ or ‘returns’ for EU markets since January, and call out markets where sample is thin.",
    created_at: iso(-1 * DAY - 2 * HOUR),
    status: "complete",
  },
  {
    id: 105,
    user_query: "Summarise exec brief: top 3 findings + one caveat.",
    created_at: iso(-1 * DAY - 9 * HOUR),
    status: "complete",
  },
  {
    id: 106,
    user_query:
      "Which demographic breaks show the biggest gap on ‘would recommend’ for the new packaging concept test?",
    created_at: iso(-3 * DAY - 4 * HOUR),
    status: "complete",
  },
  {
    id: 107,
    user_query: "Any signal on competitor mentions in the last 200 verbatims?",
    created_at: iso(-5 * DAY - 1 * HOUR),
    status: "complete",
  },
  {
    id: 108,
    user_query:
      "Drill into the loyalty programme survey: satisfaction with rewards, redemption friction, and how that tracks vs tenure segments.",
    created_at: iso(-10 * DAY - 11 * HOUR),
    status: "complete",
  },
  {
    id: 109,
    user_query: "YoY trend on ‘value for money’ — UK only.",
    created_at: iso(-14 * DAY - 6 * HOUR),
    status: "complete",
  },
  {
    id: 110,
    user_query:
      "For the brand tracker wave ending 12 Feb, list statistically meaningful shifts vs prior wave on awareness, consideration, and preference, and note where we should caveat small bases.",
    created_at: iso(-45 * DAY - 8 * HOUR),
    status: "complete",
  },
]
