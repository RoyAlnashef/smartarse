/* ── Credit system constants and server-side utilities ────────────────── */

export const CREDIT_COSTS = {
  /** Base cost for a standard chat message (1 tool call included). */
  chat_standard: 1,
  /** Cost per additional tool call beyond the first. */
  chat_extra_tool: 1,
  persona_message: 2,
  /** Phase 41a: Custom audience persona — dynamic aggregate profile. */
  custom_audience_message: 3,
  digital_twin_message: 5,
  podcast_generate: 5,
  /** Phase 44b: Focus group — per participant per round (same as persona). */
  focus_group_round: 2,
  /** Studio tools (flashcards, quiz, mind map) — same as standard chat. */
  studio_generate: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Determine the initial credit cost for a chat message based on mode.
 * For standard chat we charge 1 credit upfront (covers the first tool call).
 * Any extra tool calls are charged as a surcharge after the response.
 */
export function getChatCreditCost(opts: {
  isDigitalTwin?: boolean;
  isPersona?: boolean;
  isCustomAudience?: boolean;
}): number {
  if (opts.isDigitalTwin) return CREDIT_COSTS.digital_twin_message;
  if (opts.isCustomAudience) return CREDIT_COSTS.custom_audience_message;
  if (opts.isPersona) return CREDIT_COSTS.persona_message;
  return CREDIT_COSTS.chat_standard;
}

/**
 * Calculate the surcharge for extra tool calls.
 * The base credit already covers the first tool call (or zero).
 * Each additional tool call costs 1 extra credit.
 * Only applies to standard chat — persona/twin costs are fixed.
 *
 * @param toolCallsUsed - number of tool nodes that executed (from n8n)
 * @returns surcharge amount (0 if no extra tools were used)
 */
export function getToolCallSurcharge(toolCallsUsed: number | undefined): number {
  if (!toolCallsUsed || toolCallsUsed <= 1) return 0;
  return (toolCallsUsed - 1) * CREDIT_COSTS.chat_extra_tool;
}
