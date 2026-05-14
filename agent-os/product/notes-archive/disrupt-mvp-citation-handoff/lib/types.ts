/* ── Org settings types (Phase 38) ────────────────────────────────── */

export type DataSourceMode = "reports_only" | "survey_only" | "both";

export interface OrgSettings {
  use_weighted: boolean;
  data_source_mode: DataSourceMode;
  qual_enabled: boolean;
  show_source_filter: boolean;
}

export interface Source {
  index: number;
  type?: "document" | "survey" | "interview";
  filename: string;
  document_title?: string;
  page: number | null;
  chunk_preview: string | null;
  score: number | null;
  sample_size?: number | null;
  variables_used?: string[];
  record_manager_id?: number | null;
  /* Phase 115: enriched citation metadata */
  doc_summary?: string;
  doc_type?: string;        /* "Main Report" | "White Paper" — document-level label */
  chunk_topic?: string;     /* Q-code derived topic, e.g. "barriers to sustainability" */
  page_numbers?: number[];
  slide_numbers?: number[];
  question_code?: string;
  /** P244: multi-topic synthesis — all Q-codes referenced in this response ([3] only) */
  question_codes?: string[] | null;
  question_text?: string;
  sample_description?: string;
  base_size?: number;
  interview_segment?: string;
  interview_country?: string;
  interview_topic?: string;
  interview_age?: string;
  interview_gender?: string;
  interview_id?: string | null;
  /* P189: aggregated interview chunks for the quotes drawer */
  interview_chunks_data?: InterviewChunkData[];
  quote_count?: number;
  /* P271: per-quote survey verbatims with demographics for [3] popover structural rendering */
  survey_chunks_data?: SurveyChunkData[];
}

/* ── Visualization types ─────────────────────────────────────────────── */

export interface VegaVisualization {
  id: string;
  kind: "vega-lite";
  spec: Record<string, unknown>;
  caption?: string;
}

export interface D3Visualization {
  id: string;
  kind: "segment-matrix" | "conviction-gauge" | "sankey";
  data: Record<string, unknown>;
  caption?: string;
}

export type Visualization = VegaVisualization | D3Visualization;

/* ── Segment Profile types (Phase 40 — aggregate persona) ──────────── */

export interface SegmentProfile {
  segment_id: number;
  segment_name: string;
  size: number;
  sharePct: number;
  avgConcern: number;
  avgInfluence: number;
  avgOptimism: number;
  avgActions: number;
  topActions: { label: string; pct: number }[];
  topBarriers: { label: string; pct: number }[];
  topMotivators: { label: string; pct: number }[];
  sampleVoices: string[];
  interviewExcerpts?: string[];
  activationDescription: string;
  brief_text: string;
}

/* ── Tone-of-Voice types (Phase 45) ────────────────────────────────── */

/** Single tone dimension derived from aggregate attitudinal metrics */
export interface ToneDimension {
  level: string;
  description: string;
}

/** Data-derived rhetorical profile for persona voice differentiation */
export interface ToneProfile {
  engagement: ToneDimension;
  confidence: ToneDimension;
  valence: ToneDimension;
  concreteness: ToneDimension;
  responseStyle: ToneDimension;
  rhetoricalDefault: string;
  exemplarPatterns: string[];
}

/* ── Voice DNA types (Phase 65 — persona differentiation) ─────────── */

/** Segment-specific voice character for distinct persona responses */
export interface VoiceDNA {
  vocabulary: string;
  conversationalHabits: string;
  emotionalSignature: string;
  antiPatterns: string[];
  contrastNotes: string;
  openerExamples: string[];
}

/* ── Audience Builder types (Phase 41a) ────────────────────────────── */

export interface AudienceFilters {
  segment_ids: number[];      // empty = all segments (1-4)
  countries: string[];         // "UK" | "KSA"
  genders: string[];           // "Male" | "Female" | "Other"
  age_min?: number;            // 18-72
  age_max?: number;
  concern_min?: number;        // 1-10
  concern_max?: number;
  ethnicities: string[];       // from DB distinct values
  religions: string[];
  area_types: string[];
  industries: string[];
}

export interface AudiencePreview {
  n: number;
  sharePct: number;
  avgConcern: number;
  filters_summary: string;
}

export interface CustomAudienceProfile extends SegmentProfile {
  filters: AudienceFilters;
  is_custom: true;
  /** Name of the saved audience card that was loaded, if any */
  savedAudienceName?: string;
  /** ID of the saved audience card (UUID), used for stable colour derivation */
  savedAudienceId?: string;
}

export interface SavedAudience {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  description?: string;
  filters: AudienceFilters;
  base_size: number;
  avg_concern: number;
  filters_summary: string;
  created_at: string;
  /** Permanent colour slot (0=sky, 1=pink, 2=teal). Assigned on save, never changes. */
  color_slot: number;
}

/* ── Proactive Insights types (Phase 44c) ─────────────────────────── */

export interface AudienceInsight {
  id: string;
  metric_label: string;
  audience_value: number;
  population_value: number;
  delta_relative_pct: number;
  direction: "above" | "below";
  significance: "high" | "medium";
  interpretation: string;
}

/** Filter options populated from distinct DB values */
export interface AudienceFilterOptions {
  ethnicities: string[];
  religions: string[];
  area_types: string[];
  industries: string[];
}

/** Respondent preview for Digital Twin browser (Phase 41b) */
export interface RespondentPreview {
  uuid: string;
  age: number;
  gender: string;
  country: string;
  segment_id: number;
  segment_name: string;
  concern_level: number;
  q1_preview: string;
  verbatim_count: number;
}

/* ── Persona types (legacy individual — kept for Digital Twin future) ─ */

export interface PersonaBrief {
  respondent_id: string;
  uuid: string;
  segment_id: number;
  segment_name: string;
  country: string;

  // Demographics
  age: number;
  gender: string;
  ethnicity?: string;
  occupation?: string;
  job_status?: string;

  // Verbatim answers (exact respondent words)
  sustainability_definition: string; // Q1
  color_association: string; // Q3
  role_model: string; // Q20
  experience: string; // Q21
  brand_association: string; // QC1

  // Scale attitudes
  concern_level: number; // Q4 (1-10)
  understanding_influence: string; // Q7_label
  engagement_outlook: string; // Q8_label
  willingness_to_pay: string; // Q10_label

  // Decoded multi-code selections
  barriers: string[]; // Q11 labels where value=1
  actions_taken: string[]; // Q9 labels where value=1
  motivators: string[]; // Q12 labels where value=1
  associations: string[]; // Q2 labels where value=1

  // Quality metadata
  verbatim_richness: number;
  brief_text: string; // Pre-rendered natural language identity brief
}

export interface PersonaSession {
  persona: SegmentProfile | PersonaBrief;
  started_at: Date;
  message_count: number;
  // Digital Twin fields (kept for future use)
  is_digital_twin: boolean;
  digital_memory?: string;
  twin_metadata?: {
    verbatim_count: number;
    variable_count: number;
    upgraded_at: Date;
  };
  // Phase 44a: What-If Simulation Mode
  simulation_mode: boolean;
}

/* ── Virtual Focus Group types (Phase 44b) ───────────────────────────── */

export interface FocusGroupParticipant {
  persona: SegmentProfile;
  brief_text: string;
  label: string;
  color: string;
  /** Phase 55: true if this participant is a real interviewee rather than aggregate segment */
  isInterviewee?: boolean;
  interviewee?: InterviewRespondent;
}

export interface FocusGroupResponse {
  participant_index: number;
  participant_label: string;
  participant_color: string;
  content: string;
  timestamp: Date;
}

export interface FocusGroupRound {
  round_number: number;
  topic: string;
  responses: FocusGroupResponse[];
}

export interface FocusGroupSession {
  participants: FocusGroupParticipant[];
  rounds: FocusGroupRound[];
  started_at: Date;
  current_round: number;
  is_loading: boolean;
  loading_participant_index: number | null;
  simulation_mode: boolean;
}

/* ── Conversation context types (Roy's spec) ─────────────────────────── */

/** Slim message shape sent as prior_messages webhook field for threaded context */
export interface PriorMessage {
  role: "user" | "assistant";
  content: string;
}

/* ── Chat types ──────────────────────────────────────────────────────── */

/** P246 Phase 1: per-marker inline citation granularity.
 *  Emitted by FCR; consumed by MarkdownResponse.injectCitations for per-sentence Q-code popovers. */
export interface InlineCitation {
  index: 3 | 4;
  marker_position: number;
  /** [3]: Q-codes relevant to this marker's sentence (subset of Source.question_codes).
   *  [4]: always null in Phase 1 — [4] per-chunk popover deferred to Phase 2. */
  q_codes: string[] | null;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  visualizations?: Visualization[];
  persona?: PersonaBrief;
  org_id?: string;
  session_id?: string;
  /** P246 Phase 1: per-marker Q-code resolution for [3]/[4] inline popovers */
  inline_citations?: InlineCitation[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  visualizations?: Visualization[];
  persona_mode?: boolean;
  timestamp: Date;
  /** Original user query — set on error messages to enable retry */
  retryQuery?: string;
  /** Whether this message is a credit refund notification */
  isRefundNotice?: boolean;
  /** Guardrail route — used for conditional UI */
  route?: string;
  /** Low base size flag — shown when AI Agent reports on sub-samples < 50 */
  lowBaseWarning?: boolean;
  /** Whether this response used weighted data (Phase 36) */
  weighted?: boolean;
  /** Data source mode active when this response was generated (Phase 38) */
  data_source_mode?: DataSourceMode;
  /** P246 Phase 1: per-marker Q-code resolution for [3]/[4] inline popovers */
  inline_citations?: InlineCitation[];
}

export interface IngestionSource {
  id: string;
  document_title: string;
  data_type: "tabular" | "survey" | "csv" | "unstructured";
  status: "complete" | "processing" | "ready" | "error";
  created_at: string;
  organization_id: string;
}

export interface StudioOutput {
  id: string;
  tool_id: string;
  title: string;
  content: string;
  organization_id: string;
  created_at: string;
}

/* ── Studio tool types ─────────────────────────────────────────────── */

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface FlashcardSet {
  topic: string;
  cards: FlashcardItem[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizSet {
  topic: string;
  questions: QuizQuestion[];
}

export interface MindMapData {
  topic: string;
  markdown: string;
}

export type StudioToolId = "flashcards" | "quiz" | "mind-map";

export type StudioToolResult =
  | { tool: "flashcards"; data: FlashcardSet }
  | { tool: "quiz"; data: QuizSet }
  | { tool: "mind-map"; data: MindMapData };

/* ── Podcast types ─────────────────────────────────────────────────── */

export interface PodcastConfig {
  topic: string;
  segment_ids: number[];
  country: "UK" | "KSA" | "Both";
  tone: "professional" | "casual" | "skeptical" | "optimistic" | "neutral";
}

export interface PodcastScriptLine {
  speaker: string;
  text: string;
  personality_label: string;
}

export interface PodcastResult {
  request_id: string;
  status: "generating" | "complete" | "error";
  audio_base64?: string;
  script?: PodcastScriptLine[];
  topic?: string;
  duration_seconds?: number;
  error_message?: string;
}

/* ── Interview citation chunk data (P189) ────────────────────────────── */

/** Per-chunk data aggregated into a single [4] Source for the quotes drawer */
export interface InterviewChunkData {
  interview_country: string | null;
  interview_age: string | null;
  interview_gender: string | null;
  interview_segment: string | null;
  interview_id: string | null;
  chunk_preview: string | null;
  moderator_question: string | null;
}

/* ── Survey verbatim chunk data (P271) ───────────────────────────────── */

/** Per-verbatim data attached to the [3] Source for structural demographic
 *  rendering in the chip popover. Removes the AI-prose dependency for
 *  per-quote demographic accuracy. */
export interface SurveyChunkData {
  verbatim: string | null;
  question_code: string | null;
  question_text: string | null;
  country: string | null;
  gender_label: string | null;
  age_band: string | null;
  segment_name: string | null;
}

/* ── Qualitative Interview types (Phase 55) ──────────────────────────── */

export interface InterviewRespondent {
  id: number;
  interview_id: string;
  country: string;
  age_band: string;
  gender: string;
  education_level: string | null;
  employment_status: string | null;
  country_concern: number | null;
  personal_concern: number | null;
  individual_choices: string | null;
  sustainable_actions: string[];
}

export interface InterviewChunk {
  id: number;
  interview_id: string;
  chunk_index: number;
  content: string;
  speaker: string;
  topic_hint: string | null;
}
