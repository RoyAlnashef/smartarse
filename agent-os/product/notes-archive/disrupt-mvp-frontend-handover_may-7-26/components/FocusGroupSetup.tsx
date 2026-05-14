"use client";

import { useState, useCallback } from "react";
import { Users, MessageSquare, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SEGMENTS, type SegmentDefinition } from "@/lib/segments";
import { SEGMENT_PROFILES, buildSegmentBriefText } from "@/lib/segments";
import { CREDIT_COSTS } from "@/lib/credits";
import type { FocusGroupParticipant } from "@/lib/types";

interface FocusGroupSetupProps {
  onStart: (participants: FocusGroupParticipant[], topic: string, country?: string) => void;
  /** When true, rebuild briefs with interview excerpts */
  qualEnabled?: boolean;
  /** Live segment data from API (weighted/unweighted). Falls back to hardcoded SEGMENTS. */
  segments?: readonly SegmentDefinition[];
}

export function FocusGroupSetup({ onStart, qualEnabled = false, segments: segmentsProp }: FocusGroupSetupProps) {
  // Use live segments from API when available, fall back to hardcoded
  const segs = segmentsProp ?? SEGMENTS;

  // Segment selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Country context for the focus group
  const [country, setCountry] = useState<"UK" | "KSA" | "Both">("Both");

  // Shared state
  const [topic, setTopic] = useState("");

  const toggleSegment = useCallback((id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  const handleStart = useCallback(() => {
    if (selectedIds.length < 2 || !topic.trim()) return;

    const participants: FocusGroupParticipant[] = selectedIds.map((id) => {
      const seg = segs.find((s) => s.id === id) as SegmentDefinition;
      const profile = SEGMENT_PROFILES[id];
      return {
        persona: profile,
        brief_text: qualEnabled ? buildSegmentBriefText(profile, true) : profile.brief_text,
        label: seg.name,
        color: seg.color,
      };
    });

    onStart(participants, topic.trim(), country !== "Both" ? country : undefined);
  }, [selectedIds, topic, country, onStart, qualEnabled, segs]);

  const costPerRound = selectedIds.length * CREDIT_COSTS.focus_group_round;

  return (
    <div className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Select 2–4 segments to debate a topic. Each responds in turn, building on what others said.
      </p>

      {/* ── Segments ──────────────────────────────────────────────── */}
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Participants ({selectedIds.length}/4)
      </p>
      <div className="flex flex-col gap-1.5">
        {segs.map((seg) => {
          const isSelected = selectedIds.includes(seg.id);
          const atMax = selectedIds.length >= 4 && !isSelected;

          return (
            <button
              key={seg.id}
              onClick={() => toggleSegment(seg.id)}
              disabled={atMax}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all ${
                isSelected
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : atMax
                    ? "border-border/50 opacity-40 cursor-not-allowed"
                    : "border-border hover:bg-accent"
              }`}
            >
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border">
                {isSelected && (
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                )}
              </div>
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{seg.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">
                  n={seg.size} · Concern: {seg.avgConcern}/10{seg.intervieweeCount != null ? ` · ${seg.intervieweeCount} qualitative interviews` : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Country Context ─────────────────────────────────────── */}
      <p className="mt-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Country Context
      </p>
      <div className="flex gap-1.5">
        {(["UK", "KSA", "Both"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCountry(c)}
            className={`rounded-full border px-3 py-1 text-[10px] font-medium transition-colors ${
              country === c
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Separator className="my-3" />

      {/* Topic input */}
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Discussion Topic
      </p>
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. Should plastic bags be banned? How do you feel about carbon taxes?"
        rows={3}
        maxLength={300}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
      />
      <p className="mt-1 text-right text-[9px] tabular-nums text-muted-foreground">
        {topic.length}/300
      </p>

      {/* Cost preview */}
      {selectedIds.length >= 2 && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
          <Coins className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">{costPerRound} credits</span> per round
            ({selectedIds.length} participants × {CREDIT_COSTS.focus_group_round} each)
          </span>
        </div>
      )}

      {/* Start button */}
      <Button
        size="sm"
        className="mt-3 w-full gap-2 text-xs"
        disabled={selectedIds.length < 2 || !topic.trim()}
        onClick={handleStart}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Start Focus Group ({selectedIds.length} participants)
      </Button>
    </div>
  );
}
