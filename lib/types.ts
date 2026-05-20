export type UserRole = "admin" | "client" | "user"
export type ActiveUserRole = "admin" | "client"
export type UserRoleLabel = "disrupt" | "researcher"

export const ACTIVE_USER_ROLES: ActiveUserRole[] = ["admin", "client"]

export const USER_ROLE_LABELS: Record<ActiveUserRole, UserRoleLabel> = {
  admin: "disrupt",
  client: "researcher",
}

export interface User {
  id: string
  /** Display name; maps to Supabase `users.name` when present. */
  name: string
  email: string
  role: UserRole
  /**
   * Organization membership; maps to Supabase `users.organization_id` (UUID).
   * Legacy field name `clientId` is retained for mock data and UI compatibility.
   */
  clientId?: string
  avatarUrl?: string
  status: "active" | "inactive"
  /** UI-only until `users.last_login` (or similar) exists in Supabase. */
  lastLogin: string
  /** Maps to Supabase `users.created_at`. */
  createdAt: string
  /**
   * Lifetime credits charged across all projects (`sum(chat_results.credits_charged)`);
   * dashboard RPC; 0 when not loaded or mock.
   */
  creditsSpentLifetime: number
  /** True when provisioned via the demo access flow (request email/id or demo project assignment). */
  isDemoUser?: boolean
}

export interface Client {
  id: string
  name: string
  logoUrl?: string
  totalCredits: number
  usedCredits: number
  projectIds: string[]
  userIds: string[]
}

export interface Organization {
  id: string
  name: string
  /**
   * Project ids for this org; populated from `projects.organization_id` when listing via Supabase.
   */
  projectIds: string[]
  /**
   * Synthetic id list whose length matches member count from `users.organization_id` in the admin dashboard.
   */
  userIds: string[]
  /** Rows in `chat_results` for this org (dashboard list). */
  chatCount: number
  /** Maps to Supabase `organizations.credit_balance`. */
  creditBalance: number
  /** Maps to Supabase `organizations.status` when present (`active` | `inactive`). */
  status: "active" | "inactive"
  /** Maps to Supabase `organizations.created_at`. */
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  /** Maps to Supabase `projects.organization_id`. */
  clientId: string
  /** From joined `organizations.name` when loaded via Supabase. */
  clientName: string
  /** Maps to Supabase `projects.status` (`live` | `paused` | `archived`). */
  status: "live" | "paused" | "archived"
  /** Maps to Supabase `projects.access_until` (`YYYY-MM-DD`); null = no scheduled end. */
  accessUntil: string | null
  /**
   * Maps to Supabase `projects.display_date` (`YYYY-MM-DD`); null = client card header uses
   * `createdAt`.
   */
  displayDate: string | null
  /**
   * Maps to Supabase `projects.card_subline`; when non-empty, overrides the client project
   * card third line (otherwise auto source summary).
   */
  cardSubline: string | null
  /** Maps to Supabase `projects.created_at`. */
  createdAt: string
  /** Maps to `projects.last_activity`, else `updated_at` / `created_at`. */
  lastActivity: string
  /** Maps to Supabase `projects.credit_balance` (credits currently available). */
  totalCredits: number
  /**
   * Lifetime credits attributed on this project: `SUM(chat_results.credits_charged)` for this
   * `project_id`, stored on `projects.used_credits` and kept in sync by the billing trigger.
   */
  usedCredits: number
  assignedUserIds: string[]
  uploadedFileIds: string[]
  /** Rows in `chat_results` for this project (sidebar history count). */
  chatCount: number
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  projectId: string
  uploadedBy: string
  uploadedAt: string
  status: "uploading" | "processing" | "ready" | "error"
  /**
   * Order within the project for display and context (0 = first / highest prominence).
   * Supabase-backed rows use `project_documents.sort_order`.
   */
  sortOrder: number
  /**
   * Optional admin-set label; maps to `project_documents.display_name`.
   * When null/empty, UI uses `name` (e.g. Sources uses stem without extension).
   */
  displayName?: string | null
  /**
   * Tailwind palette token for source index color (Data Sources, citations); maps to
   * `project_documents.cite_color_token`. Null/undefined = product default pink.
   */
  citeColorToken?: string | null
  /**
   * Admin-selected file-type icon key (Data Sources, citations); maps to `project_documents.source_icon_key`.
   * Null/undefined = infer from filename (`type`).
   */
  sourceIconKey?: string | null
  /**
   * When the row is `project_personas`, optional binding to a fixed study segment slug
   * (`seg-do-nothing`, etc.). At most one file per project may use each slug.
   */
  canonicalSegmentId?: string | null
  /**
   * Segment list card body for client UI; maps to `project_personas.segment_description`.
   * Null/empty means use the baseline mock description for the bound segment.
   */
  segmentDescription?: string | null
  /**
   * Dot / shell accent color; maps to `project_personas.segment_color_token`
   * (same allowlist as `cite_color_token` on documents).
   */
  segmentColorToken?: string | null
  /** Set when `status` is `uploading` (mock or optimistic UI before persistence). */
  uploadProgress?: number
}

export interface ChatCitationSource {
  index: number
  displayName: string | null
  documentTitle: string | null
  sourceFileName: string | null
  excerpt: string | null
  url: string | null
  sourceType: string | null
  sourceCategory: string | null
  questionCode: string | null
  questionText: string | null
  /**
   * Multi-question survey sources: parsed from Disrupt `question_codes` / `questionCodes`.
   * Used by the survey tooltip to render a list of cited Q codes (handover parity).
   * Falls back to the single `questionCode` when this is null/empty.
   */
  questionCodes?: string[] | null
  respondentGroup: string | null
  sampleSize: string | null
  variablesUsed: string | null
  recordManagerId: string | null
  iconName: string | null
  iconType: string | null
  iconUrl: string | null
  /** When set, colors citation UI; else merged from project documents by index. */
  citeColorToken?: string | null
  /**
   * Optional handover-parity metadata. `sampleDescription` is the wording shown
   * with the sample pill (e.g. "All Respondents"); `baseSize` is the raw `n`
   * for that sample, accepted as number or string from upstream payloads.
   */
  sampleDescription?: string | null
  baseSize?: number | string | null
  /**
   * AI-supplied topic label for the cited chunk (e.g. "Barriers to Sustainability").
   * Maps to Disrupt `chunk_topic` / `topic_label`. Used as a "wording-lite"
   * fallback in the survey tooltip when neither the payload `question_text` nor
   * the static `Q_CODE_QUESTIONS` dictionary has prose for a Q code.
   */
  chunkTopic?: string | null
  /**
   * Per-chunk interview data aggregated on the `[4]` source for inline-popover
   * matching and the bottom-chip quotes dialog. Maps to Disrupt
   * `interview_chunks_data` (snake_case fields retained for parity with the
   * ported `lib/citation-utils.ts` matching helpers).
   */
  interviewChunks?: InterviewChunkData[] | null
  /**
   * Cited interview chunk count surfaced next to the `[4]` chip label
   * (e.g. "Qualitative Interviews (3)"). Maps to Disrupt `quote_count`.
   * When omitted, consumers should fall back to `interviewChunks.length`.
   */
  quoteCount?: number | null
}

/**
 * Per-chunk row aggregated onto the `[4]` interview citation source. Field
 * names mirror the Disrupt n8n payload (`interview_chunks_data`) so the
 * matching helpers ported from the citation-handoff bundle remain
 * untouched.
 *
 * Wire aliases supported by the parser:
 * - `respondent_id` / `interview_id`
 * - `interview_segment` / `segment_name`
 */
export interface InterviewChunkData {
  respondent_id: string | null
  interview_country: string | null
  interview_gender: string | null
  interview_age: string | null
  interview_segment: string | null
  moderator_question: string | null
  chunk_preview: string | null
  similarity: number | null
}

/**
 * Per-marker citation row. Each `[n]` occurrence in assistant content can resolve
 * to one of these rows so repeated markers (e.g. multiple `[3]`s) carry distinct
 * `q_codes` / `question_text`.
 *
 * n8n / Disrupt snake_case aliases on the wire:
 * - `inline_citations` (root array)
 * - `marker_position` (number, sort key)
 * - `q_codes` (string[] | null)
 * - `source_index` / `index` (number; matches the chip / `ChatCitationSource.index`)
 */
export interface ChatInlineCitation {
  /** Maps to `[n]` in rendered content; matches `ChatCitationSource.index`. */
  sourceIndex: number
  /** Stable position of the marker in the original content; used to align repeats. */
  marker_position: number
  /** Q codes attributed to this specific marker occurrence. */
  q_codes: string[] | null
  /** Optional per-marker question text override. */
  questionText?: string | null
}

export interface ChatMessage {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  documentIds?: string[]
  citations?: ChatCitationSource[]
  /** Per-`[n]`-occurrence metadata (sorted by `marker_position` when normalized). */
  inlineCitations?: ChatInlineCitation[] | null
}

/** Inline event when a segment persona is activated in the chat. */
export interface PersonaActivatedEvent {
  id: string
  type: "persona_activated"
  timestamp: string
  personaId: string
}

/** Inline event when a persona session is ended. */
export interface PersonaEndedEvent {
  id: string
  type: "persona_ended"
  timestamp: string
  personaId: string
}

/** Inline event when a custom audience is activated in the chat. */
export interface CustomAudienceActivatedEvent {
  id: string
  type: "custom_audience_activated"
  timestamp: string
  customAudienceName: string
  childSegmentNames: string[]
  baseSize: number | null
  avgConcern: number | null
}

/** Union of items that appear in the chat timeline (messages + system events). */
export type ChatTimelineItem =
  | ChatMessage
  | PersonaActivatedEvent
  | PersonaEndedEvent
  | CustomAudienceActivatedEvent

export function isPersonaActivatedEvent(
  item: ChatTimelineItem
): item is PersonaActivatedEvent {
  return "type" in item && item.type === "persona_activated"
}

export function isPersonaEndedEvent(
  item: ChatTimelineItem
): item is PersonaEndedEvent {
  return "type" in item && item.type === "persona_ended"
}

export function isCustomAudienceActivatedEvent(
  item: ChatTimelineItem
): item is CustomAudienceActivatedEvent {
  return "type" in item && item.type === "custom_audience_activated"
}

export interface Conversation {
  id: string
  projectId: string
  title: string
  createdAt: string
  lastMessageAt: string
  messageCount: number
  messages: ChatMessage[]
}

export interface QueryLog {
  id: string
  userId: string
  userName: string
  projectId: string
  projectName: string
  query: string
  timestamp: string
  creditsUsed: number
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

/** Flexible, persisted filter map for custom-audience definition state. */
export type CustomAudienceFilters = Record<string, unknown>

/** Child segment selected into a composed custom audience. */
export interface CustomAudienceChildSegment {
  id: string
  name: string
  colorToken: string | null
}

/** Snapshot payload saved/restored for custom-audience detail state. */
export interface CustomAudienceDefinitionSnapshot {
  filters: CustomAudienceFilters
  childSegments: CustomAudienceChildSegment[]
}

/* ────────────────────────────────────────────────────────────────────────
 * Focus Groups
 *
 * Multi-round persona debates: 2-4 segment participants respond in sequence,
 * each round costing `2 * participants` credits (see `lib/credits.ts`).
 * Persisted via `focus_group_sessions` + tagged `chat_results` rows
 * (`focus_group_session_id`, `focus_group_round_number`,
 * `focus_group_participant_index`). All four segments share `country_context`.
 * ──────────────────────────────────────────────────────────────────────── */

export type FocusGroupCountryContext = "uk" | "ksa" | "both"

/** Participant snapshot captured when the session starts (used for briefs + UI). */
export interface FocusGroupParticipant {
  /** Persona id from `lib/personas/segment-mocks.ts` (e.g. `seg-muddled-middle`). */
  personaId: string
  /** Stable segment code for analytics / wire payloads (e.g. `S3`). */
  segmentCode: string
  /** Display label used in chat bubbles and participant chips. */
  label: string
  /** Cite palette token (e.g. `violet-600`) for dots / borders / bubbles. */
  colorToken: string
  /** Optional per-participant country override (defaults to session country_context). */
  country?: FocusGroupCountryContext | null
}

/** Single participant response within a round; persisted as one `chat_results` row. */
export interface FocusGroupResponse {
  /** 0-based seat in the round (speaking order). */
  participantIndex: number
  /** Snapshot of the speaker's display label at response time. */
  participantLabel: string
  /** Snapshot of the speaker's cite color token at response time. */
  participantColorToken: string
  /** `chat_results.request_id` for this response. */
  requestId: string
  /** Final answer text from the persona webhook. */
  content: string
  /** ISO timestamp; aligns with `chat_results.created_at`. */
  timestamp: string
  /** True when the upstream call failed and the placeholder content was written. */
  isPlaceholder?: boolean
}

/** A single round of a focus-group debate. */
export interface FocusGroupRound {
  /** 1-based round number; matches `chat_results.focus_group_round_number`. */
  roundNumber: number
  /** Topic for this round; round 1 == session.initialTopic. */
  topic: string
  /** Idempotency key for the credit charge + thread anchor (see hook). */
  roundRequestId: string
  /** Responses in speaking order; index matches `participantIndex`. */
  responses: FocusGroupResponse[]
  /** ISO timestamp when the round started. */
  createdAt: string
}

/** Active or historical focus-group session; mirrors `focus_group_sessions`. */
export interface FocusGroupSession {
  id: string
  projectId: string
  organizationId: string
  createdBy: string | null
  participants: FocusGroupParticipant[]
  countryContext: FocusGroupCountryContext
  initialTopic: string
  /** Increments with each successfully charged round. */
  roundCount: number
  /** Hydrated rounds (populated by hook + history fetcher; empty for fresh sessions). */
  rounds: FocusGroupRound[]
  createdAt: string
  endedAt: string | null
}

/** Persisted custom audience for a project/org, reusable in chat context. */
export interface SavedCustomAudience {
  id: string
  projectId: string
  organizationId: string
  createdBy: string | null
  /** When true (client-only), the display name came from the builder field before Explore; save flow may skip the name prompt. */
  exploreNameWasTyped?: boolean
  name: string
  description: string | null
  filtersSummary: string | null
  baseSize: number | null
  avgConcern: number | null
  snapshot: CustomAudienceDefinitionSnapshot
  childSegmentColorTokens: string[]
  createdAt: string
  updatedAt: string
}
