"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Send,
  Loader2,
  MessageSquare,
  FlaskConical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CREDIT_COSTS } from "@/lib/credits";
import type {
  FocusGroupSession,
  FocusGroupRound,
  FocusGroupResponse,
  FocusGroupParticipant,
} from "@/lib/types";

/* ── Props ──────────────────────────────────────────────────────────── */

interface FocusGroupViewProps {
  session: FocusGroupSession;
  orgId: string;
  initialTopic: string;
  country?: string;
  onRoundComplete: (round: FocusGroupRound) => void;
  onLoadingChange: (loading: boolean, participantIndex: number | null) => void;
  simulationMode: boolean;
  onRemoveParticipant?: (segmentId: number) => void;
}

/* ── Thinking Indicator ─────────────────────────────────────────────── */

function FGThinkingIndicator({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3">
      <div
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {label.charAt(0)}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          {label} is thinking...
        </span>
      </div>
    </div>
  );
}

/* ── Response Bubble ────────────────────────────────────────────────── */

function ResponseBubble({ response }: { response: FocusGroupResponse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 px-4 py-2"
    >
      {/* Avatar */}
      <div
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
        style={{ backgroundColor: response.participant_color }}
      >
        {response.participant_label.charAt(0)}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold" style={{ color: response.participant_color }}>
          {response.participant_label}
        </p>
        <div
          className="mt-0.5 rounded-xl rounded-tl-none border px-3 py-2 text-xs leading-relaxed text-foreground"
          style={{ borderColor: response.participant_color + "30" }}
        >
          {response.content}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Per-segment stance intensity modifiers ─────────────────────────── */

const STANCE_MODIFIERS: Record<number, string> = {
  1: "You are sceptical and resistant. Keep your response brief and guarded — do not over-explain.",
  2: "You are cautiously interested but non-committal. Give a measured, pragmatic response.",
  3: "You are genuinely torn — engage with the topic but let some confusion or uncertainty show through.",
  4: "You are enthusiastic and engaged. Give a fuller, more animated response that reflects your commitment.",
};

/* ── Main Component ─────────────────────────────────────────────────── */

export function FocusGroupView({
  session,
  orgId,
  initialTopic,
  country,
  onRoundComplete,
  onLoadingChange,
  simulationMode,
  onRemoveParticipant,
}: FocusGroupViewProps) {
  const [followUpTopic, setFollowUpTopic] = useState("");
  const [creditError, setCreditError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentResponses, setCurrentResponses] = useState<FocusGroupResponse[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState<number | null>(null);

  // Auto-scroll to bottom when new responses appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentResponses, session.rounds, currentLoadingIndex]);

  /**
   * Execute a single round: call webhook sequentially for each participant,
   * injecting prior responses as context.
   */
  const executeRound = useCallback(
    async (topic: string, roundNumber: number) => {
      setIsRunning(true);
      setCreditError(null);
      setCurrentResponses([]);

      const totalCost = session.participants.length * CREDIT_COSTS.focus_group_round;

      // Deduct credits atomically before round starts
      try {
        const creditRes = await fetch("/api/credits/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "focus_group_round",
            amount: totalCost,
            metadata: {
              participants: session.participants.length,
              round: roundNumber,
            },
          }),
        });
        if (!creditRes.ok) {
          const err = await creditRes.json();
          setCreditError(err.error || "Insufficient credits");
          setIsRunning(false);
          return;
        }
      } catch {
        setCreditError("Failed to deduct credits");
        setIsRunning(false);
        return;
      }

      // Build prior context from all previous rounds
      let priorContext = "";
      for (const round of session.rounds) {
        priorContext += `\nROUND ${round.round_number} TOPIC: "${round.topic}"\n`;
        for (const r of round.responses) {
          priorContext += `${r.participant_label}: "${r.content}"\n`;
        }
      }

      const roundResponses: FocusGroupResponse[] = [];

      // Sequential calls — each participant sees previous participants' responses
      for (let i = 0; i < session.participants.length; i++) {
        const participant = session.participants[i];
        setCurrentLoadingIndex(i);
        onLoadingChange(true, i);

        // Build context of what other participants said THIS round so far
        let thisRoundContext = "";
        if (roundResponses.length > 0) {
          thisRoundContext = "\n\nOTHER PARTICIPANTS IN THIS ROUND SAID:\n";
          for (const r of roundResponses) {
            thisRoundContext += `${r.participant_label}: "${r.content}"\n`;
          }
        }

        // Build the persona brief with focus group context
        let enrichedBrief = participant.brief_text;
        if (priorContext) {
          enrichedBrief += "\n\nPREVIOUS DISCUSSION:\n" + priorContext;
        }
        if (thisRoundContext) {
          enrichedBrief += thisRoundContext;
        }
        // Append stance intensity modifier so participants respond with varying degrees of engagement
        const stanceModifier = STANCE_MODIFIERS[participant.persona.segment_id];
        if (stanceModifier) {
          enrichedBrief += "\n\nRESPONSE STYLE: " + stanceModifier;
        }

        const simulationInstruction = simulationMode
          ? "\n\nSIMULATION MODE: Predict how this segment would react to this hypothetical scenario. Cite data points, state confidence (HIGH/MEDIUM/LOW), note caveats."
          : "";

        try {
          const webhookUrl = "/api/n8n";

          const webhookRes = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chatInput: `FOCUS GROUP DISCUSSION — Round ${roundNumber}\nTopic: "${topic}"${country ? `\nCountry context: ${country}` : ""}\n\nRespond to this topic from your segment's perspective. Be concise (150-250 words). React to what other participants said if applicable. Be conversational and opinionated.${simulationInstruction}`,
                request_id: `fg-${Date.now()}-${i}`,
                organization_id: orgId,
                weighted: true,
                data_source_mode: "both",
                persona_mode: true,
                persona_brief: enrichedBrief,
                simulation_mode: simulationMode,
                sessionId: `focus-group-${session.started_at.getTime()}`,
              }),
            }
          );

          if (webhookRes.ok) {
            const data = await webhookRes.json();
            const answer = Array.isArray(data) ? data[0]?.answer : data.answer;

            const response: FocusGroupResponse = {
              participant_index: i,
              participant_label: participant.label,
              participant_color: participant.color,
              content: answer || "I need a moment to gather my thoughts on this.",
              timestamp: new Date(),
            };

            roundResponses.push(response);
            setCurrentResponses([...roundResponses]);
          } else {
            // Error — add placeholder
            roundResponses.push({
              participant_index: i,
              participant_label: participant.label,
              participant_color: participant.color,
              content: "I wasn't able to respond to this round.",
              timestamp: new Date(),
            });
            setCurrentResponses([...roundResponses]);
          }
        } catch {
          roundResponses.push({
            participant_index: i,
            participant_label: participant.label,
            participant_color: participant.color,
            content: "I wasn't able to respond to this round.",
            timestamp: new Date(),
          });
          setCurrentResponses([...roundResponses]);
        }
      }

      // Round complete
      setCurrentLoadingIndex(null);
      onLoadingChange(false, null);
      setIsRunning(false);

      const completedRound: FocusGroupRound = {
        round_number: roundNumber,
        topic,
        responses: roundResponses,
      };

      onRoundComplete(completedRound);
      setCurrentResponses([]);
    },
    [session, orgId, simulationMode, onRoundComplete, onLoadingChange]
  );

  // Start initial round automatically when session starts with 0 rounds
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (session.rounds.length === 0 && !isRunning && !hasStartedRef.current && session.participants.length >= 2 && initialTopic) {
      hasStartedRef.current = true;
      executeRound(initialTopic, 1);
    }
  }, [session, isRunning, executeRound, initialTopic]);

  const handleFollowUp = useCallback(() => {
    if (!followUpTopic.trim() || isRunning) return;
    const nextRound = session.rounds.length + (isRunning ? 1 : 1);
    executeRound(followUpTopic.trim(), nextRound);
    setFollowUpTopic("");
  }, [followUpTopic, isRunning, session.rounds.length, executeRound]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          Virtual Focus Group
        </span>
        {simulationMode && (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300">
            <FlaskConical className="h-2.5 w-2.5" />
            Simulation
          </span>
        )}
        <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
          Round {session.rounds.length + (isRunning ? 1 : 0)} · {session.participants.length} participants
        </span>
      </div>

      {/* Participants bar */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-1.5 bg-muted/30 flex-wrap">
        {session.participants.map((p, i) => (
          <div
            key={p.persona.segment_id}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium transition-all ${
              currentLoadingIndex === i
                ? "ring-2 ring-offset-1 animate-pulse"
                : ""
            }`}
            style={{
              backgroundColor: p.color + "15",
              color: p.color,
              ...(currentLoadingIndex === i ? { ringColor: p.color } : {}),
            }}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label.length > 20 ? p.label.slice(0, 18) + "..." : p.label}
            {!isRunning && session.participants.length > 2 && onRemoveParticipant && (
              <button
                onClick={() => onRemoveParticipant(p.persona.segment_id)}
                className="ml-0.5 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                title={`Remove ${p.label}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable conversation area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Completed rounds */}
        {session.rounds.map((round) => (
          <div key={round.round_number} className="border-b border-border/30">
            {/* Round header */}
            <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 backdrop-blur px-4 py-2">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">
                Round {round.round_number}
              </span>
              <span className="text-[10px] text-muted-foreground">
                &ldquo;{round.topic.length > 60 ? round.topic.slice(0, 58) + "..." : round.topic}&rdquo;
              </span>
            </div>

            {/* Responses */}
            {round.responses.map((r, idx) => (
              <ResponseBubble key={`${round.round_number}-${idx}`} response={r} />
            ))}
          </div>
        ))}

        {/* Current round in progress */}
        {isRunning && (
          <div className="border-b border-border/30">
            <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 backdrop-blur px-4 py-2">
              <MessageSquare className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-primary">
                Round {session.rounds.length + 1}
              </span>
              <Loader2 className="ml-auto h-3 w-3 animate-spin text-muted-foreground" />
            </div>

            {/* Already completed responses in this round */}
            {currentResponses.map((r, idx) => (
              <ResponseBubble key={`current-${idx}`} response={r} />
            ))}

            {/* Currently loading participant */}
            {currentLoadingIndex !== null && currentLoadingIndex < session.participants.length && (
              <FGThinkingIndicator
                label={session.participants[currentLoadingIndex].label}
                color={session.participants[currentLoadingIndex].color}
              />
            )}
          </div>
        )}

        {/* Empty state */}
        {session.rounds.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              Focus group is starting...
            </p>
          </div>
        )}
      </div>

      {/* Credit error */}
      {creditError && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2 text-[11px] text-destructive">
          {creditError}
        </div>
      )}

      {/* Follow-up input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={followUpTopic}
            onChange={(e) => setFollowUpTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFollowUp();
              }
            }}
            placeholder={
              isRunning
                ? "Waiting for current round..."
                : "Ask a follow-up question..."
            }
            disabled={isRunning}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            maxLength={300}
          />
          <Button
            size="sm"
            onClick={handleFollowUp}
            disabled={isRunning || !followUpTopic.trim()}
            className="shrink-0 gap-1.5 px-3"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <p className="mt-1 text-center text-[9px] text-muted-foreground">
          {session.participants.length * CREDIT_COSTS.focus_group_round} credits per round
        </p>
      </div>
    </div>
  );
}
