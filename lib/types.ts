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
  /** Maps to Supabase `projects.created_at`. */
  createdAt: string
  /** Maps to `projects.last_activity`, else `updated_at` / `created_at`. */
  lastActivity: string
  /** Maps to Supabase `projects.credit_balance` (credits currently available). */
  totalCredits: number
  /** Maps to Supabase `projects.used_credits` (lifetime spent; informational in UI). */
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
  /** Set when `status` is `uploading` (mock or optimistic UI before persistence). */
  uploadProgress?: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  documentIds?: string[]
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

/** Union of items that appear in the chat timeline (messages + system events). */
export type ChatTimelineItem = ChatMessage | PersonaActivatedEvent | PersonaEndedEvent

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
