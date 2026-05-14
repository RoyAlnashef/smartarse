/**
 * Credit pricing constants for chat-context modes.
 *
 * Kept in sync with the server-side credit charging RPCs:
 * - Default + single-segment + custom-audience chats charge 1 credit per turn
 *   (trigger `chat_results_apply_project_credit` + RPC
 *   `apply_project_credit_for_thread_merge`).
 * - Focus-group rounds charge 2 credits per participant per round, deducted
 *   atomically up-front via RPC
 *   `apply_project_credit_for_focus_group_round`.
 */

export const FOCUS_GROUP_CREDIT_COST_PER_PARTICIPANT = 2

/**
 * Total credits debited up front when starting / continuing a focus-group
 * round with `participantCount` participants.
 *
 * @example
 *   getFocusGroupRoundCost(2) // 4
 *   getFocusGroupRoundCost(4) // 8
 */
export function getFocusGroupRoundCost(participantCount: number): number {
  if (!Number.isFinite(participantCount) || participantCount < 1) return 0
  return Math.floor(participantCount) * FOCUS_GROUP_CREDIT_COST_PER_PARTICIPANT
}
