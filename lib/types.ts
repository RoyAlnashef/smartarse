export type UserRole = "admin" | "client" | "user"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  clientId?: string
  avatarUrl?: string
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
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

export interface Project {
  id: string
  name: string
  description: string
  clientId: string
  clientName: string
  status: "live" | "archived"
  createdAt: string
  lastActivity: string
  totalCredits: number
  usedCredits: number
  assignedUserIds: string[]
  uploadedFileIds: string[]
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  projectId: string
  uploadedBy: string
  uploadedAt: string
  status: "processing" | "ready" | "error"
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
