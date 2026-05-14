"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Users,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CitationBar } from "@/components/CitationChip";
import { MarkdownResponse } from "@/components/MarkdownResponse";
import { HelpPanel } from "@/components/HelpPanel";
import { isValidSource, filterCitedInterviewSources } from "@/lib/citation-utils";
import type { InlineCitation } from "@/lib/types";
import { useCreditBalance } from "@/lib/credits-context";
import { getChatCreditCost, getToolCallSurcharge } from "@/lib/credits";
import type { Message, Source, Visualization, PersonaSession, DataSourceMode, SegmentProfile, PersonaBrief, CustomAudienceProfile } from "@/lib/types";
import { buildSegmentBriefText, SEGMENTS } from "@/lib/segments";

/** Type guard: is the persona a SegmentProfile (aggregate) or PersonaBrief (individual)? */
function isSegmentProfile(p: SegmentProfile | PersonaBrief): p is SegmentProfile {
  return "avgConcern" in p;
}

/** Type guard: is the persona a CustomAudienceProfile (dynamic audience builder)? */
function isCustomAudience(p: SegmentProfile | PersonaBrief): p is CustomAudienceProfile {
  return "is_custom" in p && (p as CustomAudienceProfile).is_custom === true;
}

interface ChatInterfaceProps {
  orgId: string;
  personaSession?: PersonaSession | null;
  /** Segment hex colour for persona mode UI accents (e.g. #ef4444 for Do Nothing-ers) */
  personaColor?: string;
  onPersonaMessageSent?: () => void;
  onOpenPersonaPanel?: () => void;
  /** Org-level weighted setting from admin (Phase 38) */
  useWeighted?: boolean;
  /** Org-level data source mode from admin (Phase 38) */
  dataSourceMode?: DataSourceMode;
  /** Phase 39: Injected question from PersonaPanel suggested questions */
  pendingQuestion?: string | null;
  onPendingQuestionConsumed?: () => void;
  /** Phase 55: Qualitative interview data toggle */
  qualEnabled?: boolean;
  /** Phase 65: Auth user ID for claiming chat_results ownership */
  userId?: string;
  /** Phase 65: Callback when a query completes — triggers history refresh */
  onQueryCompleted?: () => void;
  /** P6: Callback when a response with sources arrives — feeds SourcesPanel */
  onNewSources?: (sources: Source[]) => void;
}

/**
 * Normalize the n8n webhook response into { answer, sources }.
 * The AI Agent node returns: [{ "output": "..." }] or { "output": "..." }
 * A refactored pipeline might return: { "answer": "...", "sources": [...] }
 */
function isValidVisualization(v: unknown): v is Visualization {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.id === "string" && typeof obj.kind === "string";
}

/** Truncate very long responses to prevent browser freeze during markdown rendering */
const MAX_ANSWER_LENGTH = 50_000;
function truncateAnswer(text: string): string {
  if (text.length <= MAX_ANSWER_LENGTH) return text;
  return text.slice(0, MAX_ANSWER_LENGTH) + "\n\n_(Response truncated — exceeded maximum length)_";
}

/** Strip leaked AI Agent tool call artifacts (defence-in-depth — n8n Format Chart Response v7.3 does this too) */
function stripToolCallArtifacts(text: string): string {
  return text
    .replace(/Calling \w+ with input:.*\n?/g, "")
    .replace(/<invoke[\s\S]*?<\/invoke>/g, "")
    .replace(/<\/?parameter[^>]*>/g, "")
    .replace(/_Internal:.*?_/g, "")
    .replace(/\n+---\n_Cached response\._\s*$/g, "")
    .replace(/\n+(?:---\n+)?\*{0,2}Sources:?\*{0,2}\s*\n\s*\[[\s\S]*$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Low base size warning — shown only when AI Agent flags n < 50 */
function LowBaseWarning({ lowBase }: { lowBase?: boolean }) {
  if (!lowBase) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <p className="text-xs text-amber-700 dark:text-amber-300">
        <strong>Low base size</strong> — some statistics are based on a small sub-sample. Interpret with caution.
      </p>
    </div>
  );
}

function parseAgentResponse(raw: unknown): {
  answer: string;
  sources: Source[];
  visualizations: Visualization[];
  route?: string;
  toolCallsUsed?: number;
  lowBaseWarning?: boolean;
  weighted?: boolean;
  data_source_mode?: DataSourceMode;
  inline_citations?: InlineCitation[];
} {
  // Handle array wrapper (n8n default)
  const data = Array.isArray(raw) ? raw[0] : raw;

  if (!data || typeof data !== "object") {
    return { answer: truncateAnswer(String(raw ?? "")), sources: [], visualizations: [] };
  }

  const obj = data as Record<string, unknown>;

  // Extract route from Guardrail passthrough (added in Format nodes v3.1)
  const route = typeof obj.route === "string" ? obj.route : undefined;

  // Extract tool_calls_used count (added in Format Chart Response v3.2)
  const toolCallsUsed =
    typeof obj.tool_calls_used === "number" ? obj.tool_calls_used : undefined;

  // Extract low_base_warning flag (Phase 25 — conditional disclaimer)
  const lowBaseWarning = obj.low_base_warning === true;

  // Extract weighted flag (Phase 36 — survey weighting mode)
  const weighted = typeof obj.weighted === "boolean" ? obj.weighted : undefined;

  // Extract data_source_mode (Phase 38)
  const data_source_mode = typeof obj.data_source_mode === "string"
    ? (obj.data_source_mode as DataSourceMode)
    : undefined;

  // Extract visualizations from any response format
  const visualizations = Array.isArray(obj.visualizations)
    ? (obj.visualizations as unknown[]).filter(isValidVisualization)
    : [];

  // P246 Phase 1: extract inline_citations (per-marker Q-code resolution for [3]/[4])
  const inline_citations: InlineCitation[] | undefined = Array.isArray(obj.inline_citations)
    ? (obj.inline_citations as unknown[])
        .filter((ic): ic is InlineCitation => {
          if (!ic || typeof ic !== "object") return false;
          const o = ic as Record<string, unknown>;
          return (
            (o.index === 3 || o.index === 4) &&
            typeof o.marker_position === "number" &&
            (o.q_codes === null || Array.isArray(o.q_codes))
          );
        })
    : undefined;

  // Try structured format first: { answer, sources, visualizations, route, tool_calls_used }
  if (typeof obj.answer === "string") {
    return {
      answer: truncateAnswer(stripToolCallArtifacts(obj.answer)),
      sources: Array.isArray(obj.sources)
        ? (obj.sources as unknown[]).filter(isValidSource)
        : [],
      visualizations,
      route,
      toolCallsUsed,
      lowBaseWarning,
      weighted,
      data_source_mode,
      inline_citations,
    };
  }

  // n8n AI Agent node format: { output: "..." }
  if (typeof obj.output === "string") {
    return { answer: truncateAnswer(stripToolCallArtifacts(obj.output)), sources: [], visualizations, route, toolCallsUsed, lowBaseWarning, weighted, data_source_mode, inline_citations };
  }

  // Fallback: { text: "..." } or { message: "..." } or { response: "..." }
  const text = obj.text ?? obj.message ?? obj.response;
  if (typeof text === "string") {
    return { answer: truncateAnswer(stripToolCallArtifacts(text)), sources: [], visualizations, route, toolCallsUsed, lowBaseWarning, weighted, data_source_mode, inline_citations };
  }

  // Last resort: stringify the whole thing
  return { answer: truncateAnswer(JSON.stringify(data, null, 2)), sources: [], visualizations: [], route, toolCallsUsed, lowBaseWarning, weighted, data_source_mode, inline_citations };
}

/** Detect whether an assistant message is an error that should show a retry button */
function isErrorMessage(content: string): boolean {
  const errorPhrases = [
    "encountered an issue",
    "temporarily unavailable",
    "timed out",
    "took longer than expected",
    "experiencing high demand",
    "configuration issue",
    "trouble querying",
    "processing issue",
    "too large to process",
    "Unable to Complete Full Analysis",
  ];
  return errorPhrases.some((phrase) => content.includes(phrase));
}

const WELCOME_MESSAGE = "Hi there! \u{1F44B} I am your Disrupt Research Assistant. I have access to the Sustainability & Culture Study 2025 (UK & KSA). How can I help you today?";

const SUGGESTION_CHIPS = [
  "What is the sample size for the UK?",
  "Show me the top 3 motivators for sustainability.",
  "Compare cultural sentiment between UK and KSA.",
];

const THINKING_PHRASES = [
  "Searching your sources...",
  "Analysing documents...",
  "Generating response...",
];

const PERSONA_THINKING_PHRASES = [
  "Channelling segment perspective...",
  "Recalling aggregate data...",
  "Forming the segment response...",
];

const POLLING_THINKING_PHRASES = [
  "Still working on your query...",
  "Complex analysis in progress...",
  "Retrieving results from the database...",
  "This is taking a bit longer than usual...",
  "Almost there \u2014 running final checks...",
  "Hang tight \u2014 processing complex data...",
];

const TWIN_THINKING_PHRASES = [
  "Consulting respondent data...",
  "Cross-referencing survey answers...",
  "Recalling their exact words...",
];

const SIMULATION_THINKING_PHRASES = [
  "Extrapolating from real data...",
  "Running hypothetical scenario...",
  "Predicting based on profile data...",
];

function ThinkingIndicator({
  isPersona = false,
  isDigitalTwin = false,
  isPolling = false,
  isSimulation = false,
}: {
  isPersona?: boolean;
  isDigitalTwin?: boolean;
  isPolling?: boolean;
  isSimulation?: boolean;
}) {
  const phrases = isPolling
    ? POLLING_THINKING_PHRASES
    : isSimulation
      ? SIMULATION_THINKING_PHRASES
      : isDigitalTwin
        ? TWIN_THINKING_PHRASES
        : isPersona
          ? PERSONA_THINKING_PHRASES
          : THINKING_PHRASES;
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phrases]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 py-4"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
        isSimulation ? "bg-amber-500/10" : isDigitalTwin ? "bg-cyan-500/10" : isPersona ? "bg-violet-500/10" : "bg-primary/10"
      }`}>
        {isSimulation ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        ) : isDigitalTwin ? (
          <Users className="h-4 w-4 text-cyan-500" />
        ) : isPersona ? (
          <Users className="h-4 w-4 text-violet-500" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
      </div>
      <div className="flex flex-col">
        <AnimatePresence mode="wait">
          <motion.span
            key={phraseIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`text-sm font-medium ${
              isSimulation ? "text-amber-500" : isDigitalTwin ? "text-cyan-500" : isPersona ? "text-violet-500" : "text-muted-foreground"
            }`}
          >
            {phrases[phraseIdx]}
          </motion.span>
        </AnimatePresence>
        <div className="mt-1.5 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                isDigitalTwin ? "bg-cyan-500/40" : isPersona ? "bg-violet-500/40" : "bg-primary/40"
              }`}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Poll the /api/chat/poll endpoint for a result.
 * Used as a fallback when the n8n webhook times out (Cloudflare 524).
 *
 * 3-tier progressive polling (~9 min total):
 *   - First 10 attempts: 3s intervals (30s — fast initial responsiveness)
 *   - Next 20 attempts: 5s intervals (100s — moderate wait)
 *   - Remaining 50 attempts: 8s intervals (400s — long-running queries)
 */
async function pollForResult(
  requestId: string,
  maxAttempts = 80,
  isCancelled?: () => boolean
): Promise<unknown | null> {
  for (let i = 0; i < maxAttempts; i++) {
    if (isCancelled?.()) return null; // P285: user clicked Stop
    const intervalMs = i < 10 ? 3000 : i < 30 ? 5000 : 8000;
    await new Promise((r) => setTimeout(r, intervalMs));
    if (isCancelled?.()) return null; // P285: also check after sleep
    try {
      const res = await fetch(`/api/chat/poll?request_id=${requestId}`);
      if (res.status === 200) {
        const data = await res.json();
        if (data.status === "complete" || data.status === "error") {
          return data.result;
        }
      }
      // 202 = still processing, continue
    } catch {
      // Network error during poll — keep trying
    }
  }
  return null; // Gave up after maxAttempts
}

export function ChatInterface({
  orgId,
  personaSession = null,
  personaColor,
  onPersonaMessageSent,
  onOpenPersonaPanel,
  useWeighted = true,
  dataSourceMode = "both",
  pendingQuestion = null,
  onPendingQuestionConsumed,
  qualEnabled = false,
  userId,
  onQueryCompleted,
  onNewSources,
}: ChatInterfaceProps) {
  // Phase 39: Stable session ID for conversation continuity.
  // Generated once per component mount — persists across all messages in this conversation.
  // The n8n Supabase Short-Term Memory node uses this to link messages together.
  const [sessionId] = useState(() => crypto.randomUUID());

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // P6: Fire onNewSources whenever the latest assistant message has sources
  useEffect(() => {
    if (!onNewSources) return;
    const last = messages[messages.length - 1];
    if (
      last?.role === "assistant" &&
      last.sources && last.sources.length > 0 &&
      !last.persona_mode &&
      !last.isRefundNotice
    ) {
      onNewSources(last.sources);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const webhookUrl = "/api/n8n";
  const isPersonaMode = personaSession !== null;
  const isDigitalTwin = personaSession?.is_digital_twin ?? false;
  const isCustomAudienceMode = personaSession !== null && isCustomAudience(personaSession.persona);
  const isSimulationMode = personaSession?.simulation_mode ?? false;
  // Segment accent colour — derive from segment filter for custom audiences
  const customAudienceColor = (() => {
    if (!isCustomAudienceMode) return "#6366f1";
    const cp = personaSession!.persona as CustomAudienceProfile;
    const ids = cp.filters?.segment_ids ?? [];
    if (ids.length === 1) {
      const seg = SEGMENTS.find((s) => s.id === Number(ids[0]));
      if (seg) return seg.color;
    }
    const savedId = cp.savedAudienceId;
    if (savedId) {
      const palette = ["#8b5cf6","#ec4899","#f59e0b","#06b6d4","#f97316","#14b8a6"];
      const hash = savedId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return palette[hash % palette.length];
    }
    return "#6366f1";
  })();
  const accentColor = isDigitalTwin ? "#06b6d4" : isCustomAudienceMode ? customAudienceColor : (personaColor ?? "#8b5cf6");

  // Credit system
  const { balance, consumeCredits, refundCredits } = useCreditBalance();

  // Phase 65: Claim chat_results ownership + notify parent for history refresh
  const claimAndNotify = useCallback(
    (reqId: string) => {
      if (userId && reqId) {
        fetch("/api/chat/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_id: reqId }),
        }).catch(() => {}); // Fire-and-forget
      }
      onQueryCompleted?.();
    },
    [userId, onQueryCompleted]
  );

  // Auto-scroll to bottom on new messages or when loading starts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Add persona welcome message when session starts
  useEffect(() => {
    if (personaSession && !personaSession.is_digital_twin) {
      const p = personaSession.persona;
      let content: string;
      if (isCustomAudience(p)) {
        const savedName = p.savedAudienceName;
        const audienceLabel = savedName ? `"${savedName}"` : p.segment_name;
        const audienceContext = savedName
          ? `This is your saved audience **"${savedName}"**.`
          : `This audience was built from your custom filters.`;
        content = savedName
          ? `**Custom audience activated.** You're speaking with **${audienceLabel}**.\n\nAsk about their collective views, barriers, or motivations.`
          : `**Custom audience activated.** You're speaking with **${audienceLabel}** (n=${p.size}, ${p.sharePct}%). Average concern: **${p.avgConcern}/10**, average sustainable actions: **${p.avgActions}**.\n\n${audienceContext} Ask about their collective views, barriers, or motivations.`;
      } else if (isSegmentProfile(p)) {
        content = `**Segment persona activated.** You're now speaking with a representative voice of **${p.segment_name}** (n=${p.size}, ${p.sharePct}%). Average concern: **${p.avgConcern}/10**, average sustainable actions: **${p.avgActions}**.\n\nAsk about this segment's views, barriers, or motivations.`;
      } else {
        content = `*Persona mode activated.* You're now speaking with a representative from **${p.segment_name}**. Their concern level is **${p.concern_level}/10**.\n\nAsk them anything about their views, barriers, or experiences.`;
      }
      const welcomeMsg: Message = {
        id: `persona-welcome-${p.segment_id}-${Date.now()}`,
        role: "assistant",
        content,
        persona_mode: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, welcomeMsg]);
      setShowSuggestions(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaSession?.persona.segment_id]);

  // P285: Stop button — abort in-flight fetch and stop polling on user request.
  // abortControllerRef holds the active fetch's controller; userCancelledRef
  // distinguishes user-Stop from the 85s auto-timeout (both fire AbortError).
  // pendingRefundRef stashes (cost, requestId) so handleStop can refund credits.
  const abortControllerRef = useRef<AbortController | null>(null);
  const userCancelledRef = useRef(false);
  const pendingRefundRef = useRef<{ cost: number; requestId: string } | null>(null);

  // Add Digital Twin welcome message when upgraded (future use — only applies to PersonaBrief)
  const twinWelcomeShown = useRef(false);
  useEffect(() => {
    if (personaSession?.is_digital_twin && !isSegmentProfile(personaSession.persona) && !twinWelcomeShown.current) {
      twinWelcomeShown.current = true;
      const meta = personaSession.twin_metadata;
      const brief = personaSession.persona as PersonaBrief;
      const twinMsg: Message = {
        id: `twin-welcome-${brief.respondent_id}`,
        role: "assistant",
        content: `*Digital Twin activated.* This respondent's complete survey record has been loaded — **${meta?.verbatim_count ?? "?"} verbatim responses** and **${meta?.variable_count ?? "?"} data points**. Their answers are now grounded in real data.\n\nAsk them anything — they'll respond using their actual survey answers.`,
        persona_mode: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, twinMsg]);
    }
    if (!personaSession?.is_digital_twin) {
      twinWelcomeShown.current = false;
    }
  }, [personaSession?.is_digital_twin, personaSession?.persona, personaSession?.twin_metadata]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
    },
    []
  );

  const sendMessage = async (content?: string, e?: FormEvent) => {
    e?.preventDefault();
    // Normalise smart quotes & dashes that browsers/keyboards inject
    const sanitised = (content ?? input)
      .replace(/[\u201C\u201D\u201F\u2033\u2036]/g, '"')  // curly double quotes → straight
      .replace(/[\u2018\u2019\u201B\u2032\u2035]/g, "'")  // curly single quotes → straight
      .replace(/[\u2013\u2014]/g, "-")                      // en/em dash → hyphen
      .trim();
    const trimmed = sanitised;
    if (!trimmed || isLoading) return;

    // Security: enforce input length limit (2000 chars max)
    if (trimmed.length > 2000) {
      const lengthMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Your message is too long. Please keep questions under 2,000 characters.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, lengthMsg]);
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      persona_mode: isPersonaMode || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);

    // Increment persona message counter immediately on send
    if (isPersonaMode && onPersonaMessageSent) {
      onPersonaMessageSent();
    }

    // Generate a unique request ID for this message — used for async polling fallback
    const requestId = crypto.randomUUID();

    // ── Credit deduction (server-side, atomic) ────────────────────
    const creditCost = getChatCreditCost({
      isDigitalTwin,
      isCustomAudience: isCustomAudienceMode,
      isPersona: isPersonaMode,
    });

    // Check client-side balance first (fast guard)
    if (balance !== null && balance < creditCost) {
      const insufficientMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `You don't have enough credits for this action. This ${isDigitalTwin ? "Digital Twin" : isPersonaMode ? "Persona" : "chat"} message costs **${creditCost} credit${creditCost > 1 ? "s" : ""}** but you only have **${balance}** remaining. Please contact your administrator to top up.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, insufficientMsg]);
      setIsLoading(false);
      return;
    }

    // Deduct credits server-side before sending the query
    const creditResult = await consumeCredits(
      creditCost,
      requestId,
      `${isDigitalTwin ? "Digital Twin" : isPersonaMode ? "Persona" : "Chat"}: ${trimmed.slice(0, 80)}`
    );

    if (!creditResult) {
      const failMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Insufficient credits. This message costs **${creditCost} credit${creditCost > 1 ? "s" : ""}**. Please contact your administrator to top up.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, failMsg]);
      setIsLoading(false);
      return;
    }

    try {
      // webhookUrl is always "/api/n8n" — guard kept for safety

      // Build request body — include persona data if in persona mode
      const body: Record<string, unknown> = {
        chatInput: trimmed,
        org_id: orgId,
        request_id: requestId,
        sessionId: sessionId,
        weighted: useWeighted,
        data_source_mode: dataSourceMode,
        qual_enabled: qualEnabled ?? false, // Phase 61: gate qual retrieval in n8n
      };

      if (isPersonaMode && personaSession) {
        body.persona_mode = true;
        // Phase 55: When qualEnabled, rebuild brief_text with interview excerpts included
        body.persona_brief = qualEnabled && isSegmentProfile(personaSession.persona)
          ? buildSegmentBriefText(personaSession.persona, true)
          : personaSession.persona.brief_text;
        body.persona_brief_concern = isSegmentProfile(personaSession.persona)
          ? personaSession.persona.avgConcern
          : (personaSession.persona as PersonaBrief).concern_level;

        // Phase 44a: What-If Simulation Mode
        if (personaSession.simulation_mode) {
          body.simulation_mode = true;
        }

        // Digital Twin enrichment — send full ground truth (future use, only for PersonaBrief)
        if (personaSession.is_digital_twin && personaSession.digital_memory) {
          body.digital_twin = true;
          body.digital_memory = personaSession.digital_memory;
        }
      }

      // Compose prior conversation context for threaded queries (Roy's spec)
      // Excluded: persona mode (stateless simulations), welcome message, refund notices
      if (!isPersonaMode) {
        const priorMessages = messages
          .filter((m) => m.id !== "welcome" && !m.isRefundNotice)
          .slice(-6) // last 6 messages = up to 3 full turns
          .map((m) => ({ role: m.role, content: m.content.substring(0, 600) }));

        if (priorMessages.length > 0) {
          body.prior_messages = priorMessages;
        }
      }

      // 85s timeout — safely under Cloudflare's ~100s proxy limit.
      // If this fires, we switch to polling Supabase for the result.
      // P285: hoisted to ref so handleStop can abort externally. userCancelledRef
      // distinguishes user-Stop from auto-timeout (both fire AbortError downstream).
      const controller = new AbortController();
      abortControllerRef.current = controller;
      userCancelledRef.current = false;
      pendingRefundRef.current = { cost: creditCost, requestId };
      const timeoutId = setTimeout(() => controller.abort(), 85_000);

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 202 Accepted — /api/n8n race-with-timeout hit the 10s sync window before
      // n8n finished. Upstream request continues in background; we poll
      // chat_results via /api/chat/poll for the final answer. (P206/IA-018)
      if (res.status === 202) {
        console.info("[ChatInterface] /api/n8n returned 202 — switching to polling");
        // Switch the ThinkingIndicator to polling mode — it rotates through
        // POLLING_THINKING_PHRASES while we wait. No static bubble needed.
        setIsPolling(true);
        const polled = await pollForResult(requestId, 80, () => userCancelledRef.current);
        setIsPolling(false);
        if (polled) {
          const { answer, sources, visualizations, toolCallsUsed: polledToolCalls, route: polledRoute, lowBaseWarning: polledLowBase, weighted: polledWeighted, data_source_mode: polledDSM, inline_citations: polledInlineCitations } =
            parseAgentResponse(polled);
          const isBackendError = isErrorMessage(answer);
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: answer,
            sources: sources.length > 0 ? sources : undefined,
            visualizations:
              visualizations.length > 0 ? visualizations : undefined,
            persona_mode: isPersonaMode || undefined,
            retryQuery: isBackendError ? trimmed : undefined,
            route: polledRoute,
            lowBaseWarning: polledLowBase || undefined,
            weighted: polledWeighted,
            data_source_mode: polledDSM,
            inline_citations: polledInlineCitations,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          // Backend-error refund (parallel to sync path)
          if (isBackendError) {
            refundCredits(creditCost);
            const refundMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Credit refunded \u2014 no charge for failed query.`,
              isRefundNotice: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, refundMsg]);
            setTimeout(() => {
              setMessages((prev) => prev.filter((m) => m.id !== refundMsg.id));
            }, 5000);
          }
          // Tool-call surcharge after polling success
          if (!isPersonaMode && !isDigitalTwin && !isBackendError) {
            const surcharge = getToolCallSurcharge(polledToolCalls);
            if (surcharge > 0) {
              consumeCredits(
                surcharge,
                requestId,
                `Compound query surcharge (${polledToolCalls} tools): ${trimmed.slice(0, 60)}`,
              );
            }
          }
          claimAndNotify(requestId);
          return;
        }
        throw new Error(
          "Query accepted for background processing, but polling could not retrieve the result.",
        );
      }

      // Cloudflare 524 — n8n is still running, switch to polling
      if (res.status === 524) {
        console.warn("[ChatInterface] Cloudflare 524 — switching to polling");
        // Show a "still thinking" placeholder that will be replaced
        const pollingPlaceholderId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: pollingPlaceholderId,
            role: "assistant",
            content:
              "This query is taking longer than usual. I\u2019m still working on it \u2014 please hold tight while I finish processing.",
            timestamp: new Date(),
          },
        ]);
        setIsPolling(true);
        const polled = await pollForResult(requestId, 80, () => userCancelledRef.current);
        setIsPolling(false);
        // Remove the placeholder message before adding the real result
        setMessages((prev) =>
          prev.filter((m) => m.id !== pollingPlaceholderId)
        );
        if (polled) {
          const { answer, sources, visualizations, toolCallsUsed: polledToolCalls, route: polledRoute, lowBaseWarning: polledLowBase, weighted: polledWeighted, data_source_mode: polledDSM, inline_citations: polledInlineCitations } =
            parseAgentResponse(polled);
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: answer,
            sources: sources.length > 0 ? sources : undefined,
            visualizations:
              visualizations.length > 0 ? visualizations : undefined,
            persona_mode: isPersonaMode || undefined,
            route: polledRoute,
            lowBaseWarning: polledLowBase || undefined,
            weighted: polledWeighted,
            data_source_mode: polledDSM,
            inline_citations: polledInlineCitations,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          // Tool-call surcharge after polling success
          if (!isPersonaMode && !isDigitalTwin) {
            const surcharge = getToolCallSurcharge(polledToolCalls);
            if (surcharge > 0) {
              consumeCredits(surcharge, requestId, `Compound query surcharge (${polledToolCalls} tools)`);
            }
          }
          claimAndNotify(requestId);
          return;
        }
        throw new Error(
          "Query timed out and polling could not retrieve the result."
        );
      }

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new Error(
          `Agent responded with ${res.status}: ${errorBody.slice(0, 200)}`
        );
      }

      // Parse JSON with fallback to polling if body is truncated/empty
      let raw: unknown;
      try {
        raw = await res.json();
      } catch (jsonErr) {
        console.warn("[ChatInterface] JSON parse failed — falling back to polling:", jsonErr);
        setIsPolling(true);
        const polled = await pollForResult(requestId, 80, () => userCancelledRef.current);
        setIsPolling(false);
        if (polled) {
          const { answer: pAnswer, sources: pSources, visualizations: pViz, toolCallsUsed: pTools, route: pRoute, lowBaseWarning: pLowBase, weighted: pWeighted, data_source_mode: pDSM, inline_citations: pInlineCitations } =
            parseAgentResponse(polled);
          const pollMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: pAnswer,
            sources: pSources.length > 0 ? pSources : undefined,
            visualizations: pViz.length > 0 ? pViz : undefined,
            persona_mode: isPersonaMode || undefined,
            route: pRoute,
            lowBaseWarning: pLowBase || undefined,
            weighted: pWeighted,
            data_source_mode: pDSM,
            inline_citations: pInlineCitations,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, pollMsg]);
          if (!isPersonaMode && !isDigitalTwin) {
            const surcharge = getToolCallSurcharge(pTools);
            if (surcharge > 0) {
              consumeCredits(surcharge, requestId, `Compound query surcharge (${pTools} tools)`);
            }
          }
          claimAndNotify(requestId);
          return;
        }
        throw new Error("Response body was empty and polling could not retrieve the result.");
      }
      const { answer, sources, visualizations, toolCallsUsed, route: directRoute, lowBaseWarning: directLowBase, weighted: directWeighted, data_source_mode: directDSM, inline_citations: directInlineCitations } = parseAgentResponse(raw);

      // Detect backend error responses (from Format Chart Response error handling)
      const isBackendError = isErrorMessage(answer);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        sources: sources.length > 0 ? sources : undefined,
        visualizations: visualizations.length > 0 ? visualizations : undefined,
        persona_mode: isPersonaMode || undefined,
        retryQuery: isBackendError ? trimmed : undefined,
        route: directRoute,
        lowBaseWarning: directLowBase || undefined,
        weighted: directWeighted,
        data_source_mode: directDSM,
        inline_citations: directInlineCitations,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // A2: If backend returned an error, refund credits and show notice
      if (isBackendError) {
        refundCredits(creditCost);
        const refundMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Credit refunded — no charge for failed query.`,
          isRefundNotice: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, refundMsg]);
        setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== refundMsg.id));
        }, 5000);
      }

      // Tool-call surcharge: standard chat base covers 1 tool call.
      // Each extra tool call costs 1 additional credit.
      // Does NOT apply to persona/twin (their costs are fixed).
      if (!isPersonaMode && !isDigitalTwin) {
        const surcharge = getToolCallSurcharge(toolCallsUsed);
        if (surcharge > 0) {
          consumeCredits(
            surcharge,
            requestId,
            `Compound query surcharge (${toolCallsUsed} tools): ${trimmed.slice(0, 60)}`
          );
        }
      }

      // Phase 65: Claim ownership + refresh history
      claimAndNotify(requestId);

    } catch (err) {
      console.error("[ChatInterface] fetch error:", err);

      const isAbort =
        err instanceof DOMException && err.name === "AbortError";
      const errDetail =
        err instanceof Error ? err.message : String(err);

      // P285: distinguish user-cancel from auto-timeout. Both fire AbortError.
      if (isAbort && userCancelledRef.current) {
        console.info("[ChatInterface] User cancelled query");
        // Refund credits if we deducted any for this request
        if (pendingRefundRef.current && pendingRefundRef.current.cost > 0) {
          refundCredits(pendingRefundRef.current.cost);
        }
        // Show a small cancelled message in the chat
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "⌀ Query cancelled.",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        setIsPolling(false);
        userCancelledRef.current = false;
        pendingRefundRef.current = null;
        abortControllerRef.current = null;
        return;
      }

      // AbortController timeout (85s) — n8n is likely still running, try polling
      if (isAbort) {
        console.warn("[ChatInterface] AbortController timeout — switching to polling");
        // Show a "still thinking" placeholder that will be replaced
        const pollingPlaceholderId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: pollingPlaceholderId,
            role: "assistant",
            content:
              "This query is taking longer than usual. I\u2019m still working on it \u2014 please hold tight while I finish processing.",
            timestamp: new Date(),
          },
        ]);
        try {
          setIsPolling(true);
          const polled = await pollForResult(requestId, 80, () => userCancelledRef.current);
          setIsPolling(false);
          // Remove the placeholder message before adding the real result
          setMessages((prev) =>
            prev.filter((m) => m.id !== pollingPlaceholderId)
          );
          if (polled) {
            const { answer, sources, visualizations, toolCallsUsed: polledToolCalls, route: polledRoute2, lowBaseWarning: polledLowBase2, weighted: polledWeighted2, data_source_mode: polledDSM2, inline_citations: polledInlineCitations2 } =
              parseAgentResponse(polled);
            const assistantMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: answer,
              sources: sources.length > 0 ? sources : undefined,
              visualizations:
                visualizations.length > 0 ? visualizations : undefined,
              persona_mode: isPersonaMode || undefined,
              route: polledRoute2,
              lowBaseWarning: polledLowBase2 || undefined,
              weighted: polledWeighted2,
              data_source_mode: polledDSM2,
              inline_citations: polledInlineCitations2,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            // Tool-call surcharge after polling success
            if (!isPersonaMode && !isDigitalTwin) {
              const surcharge = getToolCallSurcharge(polledToolCalls);
              if (surcharge > 0) {
                consumeCredits(surcharge, requestId, `Compound query surcharge (${polledToolCalls} tools)`);
              }
            }
            claimAndNotify(requestId);
            return; // Polling succeeded — credits stay deducted
          }
        } catch {
          setIsPolling(false);
          // Remove placeholder on polling failure too
          setMessages((prev) =>
            prev.filter((m) => m.id !== pollingPlaceholderId)
          );
        }
      }

      // Query truly failed — refund credits
      refundCredits(creditCost);

      let content: string;
      if (isAbort) {
        content =
          "This query took longer than expected. The system may still be processing.\n\n**Suggestion:** Try a simpler version of your question, or click **Retry** below.";
      } else if (errDetail.includes("Webhook URL")) {
        content = "Chat agent is not configured. Please set the webhook URL.";
      } else {
        content = `Sorry, I encountered an issue processing your request. Please try again.\n\n_Debug: ${errDetail}_`;
      }

      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        retryQuery: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);

      // A2: Show credit refund notification (auto-dismiss after 5s)
      const refundMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Credit refunded — no charge for failed query.`,
        isRefundNotice: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, refundMsg]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== refundMsg.id));
      }, 5000);
    } finally {
      setIsPolling(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => sendMessage(undefined, e);

  // P285: Stop button — abort active fetch / polling, refund credits, show cancelled msg.
  // The actual cleanup (refund, message, state reset) lives in the AbortError catch
  // branch in sendMessage, gated by userCancelledRef. Here we just trigger the abort.
  const handleStop = () => {
    userCancelledRef.current = true;
    abortControllerRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Phase 39: Pick up suggested questions injected from PersonaPanel
  useEffect(() => {
    if (pendingQuestion && !isLoading) {
      sendMessage(pendingQuestion);
      onPendingQuestionConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  return (
    <div
      className="flex h-full flex-1 flex-col bg-background"
      style={isPersonaMode ? { boxShadow: `inset 0 0 0 1px ${accentColor}33` } : undefined}
    >
      {/* Persona mode banner */}
      {isPersonaMode && personaSession && (
        <div
          className="flex items-center gap-2 border-b px-4 py-2"
          style={{ borderColor: accentColor + "33", backgroundColor: accentColor + "0d" }}
        >
          <Users className="h-3.5 w-3.5" style={{ color: accentColor }} />
          <span className="text-xs font-medium" style={{ color: accentColor }}>
            {isCustomAudienceMode ? "Custom Audience" : "Segment Persona"}{isSimulationMode ? " · Simulation" : ""} &middot; {personaSession.persona.segment_name}
          </span>
          {isSegmentProfile(personaSession.persona) && (
            <span className="ml-auto text-[10px]" style={{ color: accentColor + "99" }}>
              n={personaSession.persona.size} ({personaSession.persona.sharePct}%)
            </span>
          )}
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mb-6 ${
                  msg.role === "user" ? "flex justify-end" : ""
                }`}
              >
                {msg.role === "user" ? (
                  <div
                    className={`max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 text-sm text-primary-foreground ${!msg.persona_mode ? "bg-primary" : ""}`}
                    style={msg.persona_mode ? { backgroundColor: accentColor } : undefined}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-full">
                    {/* A2: Credit refund notification — green, auto-dismiss */}
                    {msg.isRefundNotice ? (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {msg.content}
                        </span>
                      </motion.div>
                    ) : msg.content.includes("offline") ||
                    msg.content.includes("not configured") ? (
                      <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl border p-5 shadow-sm ${!msg.persona_mode ? "border-border bg-card" : ""}`}
                        style={msg.persona_mode
                          ? { borderColor: accentColor + "33", backgroundColor: accentColor + "08" }
                          : undefined
                        }
                      >
                        {/* Persona badge */}
                        {msg.persona_mode && personaSession && (
                          <div className="mb-2 flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            <span className="text-[10px] font-medium" style={{ color: accentColor }}>
                              Speaking as &middot; {personaSession.persona.segment_name}
                            </span>
                          </div>
                        )}
                        {(() => {
                          // Filter [4] interview_chunks_data to only cited chunks so
                          // the bottom CitationBar drawer shows only what was quoted.
                          const displaySources = filterCitedInterviewSources(
                            msg.content,
                            msg.inline_citations,
                            msg.sources ?? []
                          );
                          return (
                            <>
                              <MarkdownResponse
                                content={msg.content}
                                sources={displaySources}
                                visualizations={msg.visualizations}
                                inlineCitations={msg.inline_citations}
                              />
                              {displaySources && displaySources.length > 0 && !msg.persona_mode && (
                                <>
                                  <div className="my-3 border-t border-border" />
                                  <CitationBar sources={displaySources} />
                                </>
                              )}
                            </>
                          );
                        })()}
                        {/* Ph25: Low base warning — only when AI Agent flags n < 50 */}
                        <LowBaseWarning lowBase={msg.lowBaseWarning} />
                        {/* A1: Retry button on error messages */}
                        {(msg.retryQuery || isErrorMessage(msg.content)) && !isLoading && (
                          <div className="mt-3 border-t border-border pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const query = msg.retryQuery || (() => {
                                  // Find the most recent user message before this error
                                  const idx = messages.findIndex((m) => m.id === msg.id);
                                  for (let i = idx - 1; i >= 0; i--) {
                                    if (messages[i].role === "user") return messages[i].content;
                                  }
                                  return "";
                                })();
                                if (query) sendMessage(query);
                              }}
                              className="gap-1.5 text-xs"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Retry
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Suggestion chips — shown below the welcome message */}
          {showSuggestions && !isLoading && !isPersonaMode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              className="flex flex-wrap gap-2"
            >
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent"
                >
                  {chip}
                </button>
              ))}
              {/* Persona mode chip */}
              <button
                onClick={onOpenPersonaPanel}
                className="rounded-lg border border-violet-500/30 bg-violet-50 px-3 py-2 text-xs text-violet-700 transition-colors hover:bg-violet-100 dark:bg-violet-950/20 dark:text-violet-300"
              >
                <Users className="mr-1 inline h-3 w-3" />
                Explore a segment
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {isLoading && <ThinkingIndicator isPersona={isPersonaMode} isDigitalTwin={isDigitalTwin} isPolling={isPolling} isSimulation={isSimulationMode} />}
          </AnimatePresence>
        </div>
      </div>

      {/* Input area */}
      <div className={`border-t px-4 pb-4 pt-3 ${
        isDigitalTwin
          ? "border-cyan-500/20 bg-cyan-50/30 dark:bg-cyan-950/10"
          : isPersonaMode
            ? "border-violet-500/20 bg-violet-50/30 dark:bg-violet-950/10"
            : "border-border bg-background"
      }`}>
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              maxLength={2000}
              placeholder={
                isSimulationMode
                  ? "Describe a scenario or hypothesis..."
                  : isPersonaMode
                    ? `Ask about the ${personaSession?.persona.segment_name ?? "segment"}...`
                    : "Ask about your sources..."
              }
              rows={1}
              disabled={isLoading}
              className={`w-full resize-none rounded-xl border px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 ${
                isDigitalTwin
                  ? "border-cyan-500/30 bg-white focus:ring-cyan-500/40 dark:bg-cyan-950/20"
                  : isPersonaMode
                    ? "border-violet-500/30 bg-white focus:ring-violet-500/40 dark:bg-violet-950/20"
                    : "border-input bg-muted/50 focus:ring-ring"
              }`}
            />
          </div>
          {isLoading ? (
            // P285: Stop button — abort in-flight query (auto-refunds credits + shows cancelled msg)
            <Button
              type="button"
              size="icon"
              onClick={handleStop}
              title="Stop generating"
              className="h-11 w-11 shrink-0 rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className={`h-11 w-11 shrink-0 rounded-xl ${
                isDigitalTwin ? "bg-cyan-600 hover:bg-cyan-700" : isPersonaMode ? "bg-violet-600 hover:bg-violet-700" : ""
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
        <div className="mx-auto mt-2 flex max-w-3xl items-center justify-center gap-2">
          <p className="text-center text-[11px] text-muted-foreground">
            {isPersonaMode
              ? "Responses represent this segment's collective perspective based on aggregate survey data."
              : "Responses are generated from your uploaded sources. Always verify important information."}
          </p>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
            title="Help & User Guide"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Help Panel overlay */}
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
