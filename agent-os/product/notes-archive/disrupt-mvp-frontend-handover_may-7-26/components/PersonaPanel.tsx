"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  MessageCircle,
  Gauge,
  CheckCircle2,
  Zap,
  Info,
  ChevronDown,
  FlaskConical,
  BookOpen,
  Bookmark,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SEGMENTS,
  fetchSegments,
  type SegmentDefinition,
} from "@/lib/segments";
import type { PersonaBrief, PersonaSession, SegmentProfile, CustomAudienceProfile, FocusGroupSession, FocusGroupParticipant } from "@/lib/types";
import { buildFiltersSummary } from "@/lib/audience-query";
import { AudienceBuilder } from "@/components/AudienceBuilder";
import { RespondentBrowser } from "@/components/RespondentBrowser";
import { FocusGroupSetup } from "@/components/FocusGroupSetup";

/** Type guard: is the persona a SegmentProfile (aggregate) or PersonaBrief (individual)? */
function isSegmentProfile(p: SegmentProfile | PersonaBrief): p is SegmentProfile {
  return "avgConcern" in p;
}

/** Type guard: is the persona a CustomAudienceProfile? */
function isCustomAudience(p: SegmentProfile | PersonaBrief): p is CustomAudienceProfile {
  return "is_custom" in p && (p as CustomAudienceProfile).is_custom === true;
}

/* ── Props ─────────────────────────────────────────────────────────── */

interface PersonaPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  activePanel: "studio" | "persona";
  onSwitchPanel: (panel: "studio" | "persona") => void;
  personaActive: boolean;
  personaSession: PersonaSession | null;
  onPersonaStart: (persona: SegmentProfile | PersonaBrief | CustomAudienceProfile) => void;
  onPersonaEnd: () => void;
  onPersonaUpgrade: (
    digitalMemory: string,
    metadata: { verbatim_count: number; variable_count: number }
  ) => void;
  onSendQuestion?: (question: string) => void;
  onToggleSimulation?: () => void;
  // Phase 44b: Focus Group
  focusGroupSession?: FocusGroupSession | null;
  onFocusGroupStart?: (participants: FocusGroupParticipant[], topic: string, country?: string) => void;
  onFocusGroupEnd?: () => void;
  onRemoveParticipant?: (segmentId: number) => void;
  // Phase 55: Qualitative Interviews
  qualEnabled?: boolean;
  // Weighted toggle from admin settings
  useWeighted?: boolean;
}

/* ── Segment Card ──────────────────────────────────────────────────── */

function SegmentCard({
  segment,
  selected,
  onClick,
  qualEnabled = false,
}: {
  segment: SegmentDefinition;
  selected: boolean;
  onClick: () => void;
  qualEnabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-accent"
      }`}
    >
      <div className="flex w-full items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: segment.color }}
        />
        <span className="text-xs font-semibold text-foreground">
          {segment.name}
        </span>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        {segment.activationDescription || segment.traits}
      </p>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-[10px] tabular-nums text-muted-foreground">
          Survey n={segment.size} ({segment.sharePct}%)
        </span>
        {qualEnabled && segment.intervieweeCount != null && (
          <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
            · {segment.intervieweeCount} qualitative interviews
          </span>
        )}
      </div>
    </button>
  );
}

/* ── Active Persona Card ───────────────────────────────────────────── */

function ActivePersonaCard({
  persona,
  session,
  messageCount,
  onEnd,
  onToggleSimulation,
  qualEnabled = false,
  savedAudienceCount = 0,
}: {
  persona: SegmentProfile | PersonaBrief;
  session: PersonaSession;
  messageCount: number;
  onEnd: () => void;
  onToggleSimulation?: () => void;
  qualEnabled?: boolean;
  savedAudienceCount?: number;
}) {
  const seg = isSegmentProfile(persona);
  const isTwin = session.is_digital_twin;
  const isCustom = isCustomAudience(persona);
  const isSavedAudience = isCustom && !!(persona as CustomAudienceProfile).savedAudienceName;

  // Save-during-session state (only for unsaved custom audiences)
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);

  async function handleSave() {
    if (!saveName.trim() || !isCustom) return;
    const cp = persona as CustomAudienceProfile;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/audience/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName.trim(),
          filters: cp.filters,
          base_size: cp.size,
          avg_concern: cp.avgConcern,
          filters_summary: buildFiltersSummary(cp.filters),
        }),
      });
      if (res.ok) {
        setShowSaveDialog(false);
        setSaveName("");
        setSavedJustNow(true);
      }
    } finally {
      setSaveLoading(false);
    }
  }

  // Determine accent color: cyan for twin, segment colour for custom audience, segment colour for standard
  const accentColor = (() => {
    if (isTwin) return "#06b6d4";
    if (isCustom) {
      const cp = persona as CustomAudienceProfile;
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
    }
    return SEGMENTS.find((s) => s.id === persona.segment_id)?.color || "#94a3b8";
  })();

  return (
    <div
      className="mx-3 rounded-xl border bg-gradient-to-b to-transparent p-4"
      style={{ borderColor: accentColor + "33", backgroundImage: `linear-gradient(to bottom, ${accentColor}0d, transparent)` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: accentColor + "1a",
              color: accentColor,
            }}
          >
            {isTwin ? <Zap className="h-4 w-4" /> : isCustom ? <Users className="h-4 w-4" /> : `S${persona.segment_id}`}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {isTwin ? "Digital Twin" : persona.segment_name}
            </p>
            <p className="text-[10px] leading-snug text-muted-foreground">
              {isTwin && !seg
                ? `${(persona as PersonaBrief).gender}, ${(persona as PersonaBrief).age}, ${(persona as PersonaBrief).country} · ${persona.segment_name}`
                : seg ? persona.activationDescription : SEGMENTS.find((s) => s.id === persona.segment_id)?.activationDescription || persona.segment_name}
            </p>
          </div>
        </div>
        <button
          onClick={onEnd}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="End session"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Separator className="my-3" />

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            Avg Concern: <span className="font-medium text-foreground">{seg ? persona.avgConcern : (persona as PersonaBrief).concern_level}/10</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            Avg Actions: <span className="font-medium text-foreground">{seg ? persona.avgActions : (persona as PersonaBrief).actions_taken.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            Survey: <span className="font-medium text-foreground">n={seg ? persona.size : "1"} ({seg ? `${persona.sharePct}%` : "—"})</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            Messages: <span className="font-medium text-foreground">{messageCount}</span>
          </span>
        </div>
      </div>

      <Separator className="my-3" />

      {/* Digital Twin metadata badge */}
      {isTwin && session.twin_metadata && (
        <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 px-2.5 py-1.5 mb-2">
          <Zap className="h-3 w-3 text-cyan-600" />
          <span className="text-[10px] font-medium text-cyan-700 dark:text-cyan-300">
            Data-Synced Twin · {session.twin_metadata.verbatim_count} verbatims · {session.twin_metadata.variable_count} data points
          </span>
        </div>
      )}

      {/* Phase 44a: What-If Simulation Mode toggle */}
      {onToggleSimulation && (
        <div className={`flex items-center justify-between rounded-lg px-2.5 py-2 mb-2 ${
          session.simulation_mode
            ? "bg-amber-500/10 border border-amber-500/30"
            : "bg-muted/50"
        }`}>
          <div className="flex items-center gap-1.5">
            <FlaskConical className={`h-3 w-3 ${session.simulation_mode ? "text-amber-600" : "text-muted-foreground"}`} />
            <span className={`text-[10px] font-medium ${session.simulation_mode ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}>
              What-If Mode
            </span>
          </div>
          <button
            onClick={onToggleSimulation}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              session.simulation_mode
                ? "bg-amber-500"
                : "bg-muted-foreground/20"
            }`}
            role="switch"
            aria-checked={session.simulation_mode}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
              session.simulation_mode ? "translate-x-[18px]" : "translate-x-0.5"
            }`} />
          </button>
        </div>
      )}

      {/* Sample voice / definition preview */}
      {seg && persona.sampleVoices.length > 0 ? (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Voice from this segment
          </p>
          <p className="text-[10px] italic leading-relaxed text-muted-foreground">
            &ldquo;{persona.sampleVoices[0].length > 120 ? persona.sampleVoices[0].slice(0, 120) + "..." : persona.sampleVoices[0]}&rdquo;
          </p>
        </div>
      ) : !seg ? (
        <p className="text-[10px] italic leading-relaxed text-muted-foreground">
          &ldquo;
          {(persona as PersonaBrief).sustainability_definition.length > 120
            ? (persona as PersonaBrief).sustainability_definition.slice(0, 120) + "..."
            : (persona as PersonaBrief).sustainability_definition}
          &rdquo;
        </p>
      ) : null}

      {/* Phase 55+56: Interview excerpts with provenance (only when qual_enabled) */}
      {seg && qualEnabled && persona.interviewExcerpts && persona.interviewExcerpts.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
            From In-Depth Interviews (N=62, separate study)
          </p>
          <p className="text-[8px] text-emerald-500/60 dark:text-emerald-400/40 mb-1">
            Illustrative &mdash; matched by concern level, not survey respondents
          </p>
          <div className="space-y-1">
            {persona.interviewExcerpts.slice(0, 2).map((ex, i) => (
              <p key={i} className="text-[10px] italic leading-relaxed text-emerald-700/70 dark:text-emerald-300/70">
                {ex.length > 150 ? ex.slice(0, 150) + "..." : ex}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Top barriers with percentages */}
      {seg && persona.topBarriers.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top Barriers
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {persona.topBarriers.slice(0, 3).map((b) => (
              <span
                key={b.label}
                className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground"
              >
                {b.label} ({b.pct}%)
              </span>
            ))}
          </div>
        </div>
      )}
      {!seg && (persona as PersonaBrief).barriers.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Barriers
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(persona as PersonaBrief).barriers.slice(0, 4).map((b) => (
              <span
                key={b}
                className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Save audience during session — only for unsaved custom audiences */}
      {isCustom && !isSavedAudience && (
        <div className="mt-3">
          {savedJustNow ? (
            <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[10px] font-medium text-muted-foreground">
              <Bookmark className="h-3 w-3" />
              Audience saved
            </div>
          ) : savedAudienceCount >= 3 ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs opacity-50"
              disabled
            >
              <Bookmark className="h-3 w-3" />
              Save this audience (limit 3/3)
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => setShowSaveDialog(true)}
            >
              <Bookmark className="h-3 w-3" />
              Save this audience
            </Button>
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full gap-2 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
        onClick={onEnd}
      >
        <X className="h-3 w-3" />
        End Session
      </Button>

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-sm">Save this audience</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <Input
              placeholder="Audience name (required)"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              maxLength={100}
              className="text-xs"
              onKeyDown={(e) => e.key === "Enter" && !saveLoading && saveName.trim() && handleSave()}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              Saves the current filters so you can reload this audience later.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setShowSaveDialog(false); setSaveName(""); }}>
              Cancel
            </Button>
            <Button size="sm" className="text-xs" disabled={!saveName.trim() || saveLoading} onClick={handleSave}>
              {saveLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── How It Works Card ─────────────────────────────────────────────── */

function HowItWorksCard({ qualEnabled = false }: { qualEnabled?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-3 mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/60"
      >
        <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-[11px] font-medium text-muted-foreground">
          How It Works
        </span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 rounded-b-lg border-x border-b border-border/60 bg-muted/10 px-3 py-3">
              {/* Data Sources */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  Data Sources
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  Every number, percentage, and quote comes directly from real
                  research data &mdash; never AI-generated.
                </p>
                <ul className="mt-1 space-y-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">Quantitative Survey</span>{" "}
                    (N=1,008) &mdash; structured questionnaire providing percentages, averages, and statistical breakdowns.
                  </li>
                  {qualEnabled && (
                    <li>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Qualitative Interviews</span>{" "}
                      (N=62) &mdash; in-depth conversations providing quotes that illustrate the human experience behind the numbers.
                    </li>
                  )}
                </ul>
              </div>

              {/* What Gets Computed */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  What Gets Computed
                </p>
                <ul className="mt-1 space-y-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">Segment Persona</span>{" "}
                    — Pre-computed averages and top-5 action/barrier/motivator
                    lists from that segment&apos;s respondents.
                  </li>
                  <li>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">Custom Audience</span>{" "}
                    — Real-time aggregation across your filtered group: averages,
                    ranked lists with real percentages, and 3 real verbatim
                    quotes.
                  </li>
                </ul>
              </div>

              {/* What the AI Can See */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  What the AI Can See
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  The AI receives only the computed profile text. It cannot
                  access the database or fabricate data beyond the profile. Every
                  response is grounded in real research data.
                </p>
              </div>

              {/* How Qual & Quant Work Together (Phase 56) */}
              {qualEnabled && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    How Qual &amp; Quant Work Together
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    Survey data tells you &ldquo;what&rdquo; and &ldquo;how
                    many.&rdquo; Interview data tells you &ldquo;why&rdquo; and
                    &ldquo;how it feels.&rdquo; The AI always leads with survey
                    statistics and uses{" "}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      emerald-highlighted
                    </span>{" "}
                    interview quotes as illustration &mdash; never the reverse.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Panel ────────────────────────────────────────────────────── */

export function PersonaPanel({
  collapsed,
  onToggle,
  activePanel,
  onSwitchPanel,
  personaActive,
  personaSession,
  onPersonaStart,
  onPersonaEnd,
  onPersonaUpgrade,
  onSendQuestion,
  onToggleSimulation,
  focusGroupSession,
  onFocusGroupStart,
  onFocusGroupEnd,
  onRemoveParticipant,
  qualEnabled,
  useWeighted,
}: PersonaPanelProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 41a + 44b: Segments vs Build Audience vs Focus Group tab
  type PersonaTab = "segments" | "audience" | "focus-group";
  const [activeTab, setActiveTab] = useState<PersonaTab>("segments");

  // Live segment data (fetched from API, falls back to hardcoded)
  const [liveSegments, setLiveSegments] = useState<readonly SegmentDefinition[]>(SEGMENTS);

  // Saved audience count — fetched so we can show limit warning in ActivePersonaCard
  const [savedAudienceCount, setSavedAudienceCount] = useState(0);
  useEffect(() => {
    fetch("/api/audience/saved")
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown[]) => setSavedAudienceCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSegments(useWeighted).then((data) => {
      if (data && data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
        // Merge API data with fallback traits/descriptions/activationDescriptions
        const merged = data.segments.map((s) => {
          const fallback = SEGMENTS.find((f) => f.id === s.id);
          return {
            ...s,
            traits: fallback?.traits ?? "",
            description: fallback?.description ?? "",
            activationDescription: fallback?.activationDescription ?? "",
          };
        });
        setLiveSegments(merged);
      }
    }).catch(() => {
      // Fetch failed — keep hardcoded fallback (already set as initial state)
    });
  }, [useWeighted]);

  // Digital Twin activation from RespondentBrowser — activates twin for a specific respondent UUID
  const [twinLoading, setTwinLoading] = useState(false);
  const handleActivateTwin = useCallback(async (respondentId: string) => {
    setTwinLoading(true);
    setError(null);
    try {
      // Step 1: Get the respondent's basic info for PersonaBrief via persona/select with respondent_id
      // We'll use the twin endpoint directly — it returns digital_memory
      const twinRes = await fetch("/api/persona/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondent_id: respondentId }),
      });
      if (!twinRes.ok) {
        const err = await twinRes.json();
        throw new Error(err.error || `HTTP ${twinRes.status}`);
      }
      const { digital_memory, verbatim_count, variable_count } = await twinRes.json();
      onPersonaUpgrade(digital_memory, { verbatim_count, variable_count });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate Digital Twin");
    } finally {
      setTwinLoading(false);
    }
  }, [onPersonaUpgrade]);

  // Phase 41a: Handle audience builder "Explore" click
  const handleAudienceExplore = useCallback((profile: CustomAudienceProfile) => {
    onPersonaStart(profile);
  }, [onPersonaStart]);

  const handleStartInterview = useCallback(async () => {
    if (selectedSegment === null) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/persona/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment_id: selectedSegment,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const { persona } = (await res.json()) as { persona: SegmentProfile };
      onPersonaStart(persona);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load persona");
    } finally {
      setLoading(false);
    }
  }, [selectedSegment, onPersonaStart]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 48 : 340 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex h-full shrink-0 flex-col border-l border-border bg-sidebar overflow-hidden"
    >
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center border-b border-border">
        {collapsed ? (
          <button
            onClick={onToggle}
            className="mx-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Expand panel"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex w-full items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Personas
              </span>
              {personaActive && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onSwitchPanel("studio")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Switch to Studio"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onToggle}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Collapse panel"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {collapsed ? (
        <div className="flex flex-col items-center gap-2 pt-3">
          <button
            onClick={() => onSwitchPanel("studio")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Studio"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            onClick={() => onSwitchPanel("persona")}
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              activePanel === "persona"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            title="Persona"
          >
            <Users className="h-4 w-4" />
            {personaActive && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-primary" />
            )}
          </button>
        </div>
      ) : (
        <>

          {/* Session status badge */}
          {(personaSession || focusGroupSession) && (
            <div className="flex items-center gap-1.5 px-4 pb-2">
              {focusGroupSession ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Focus Group — {focusGroupSession.is_loading ? "Discussing..." : `${focusGroupSession.rounds.length} rounds`}
                </span>
              ) : personaSession ? (
                (() => {
                  const sessionColor = personaSession.is_digital_twin
                    ? "#06b6d4"
                    : isCustomAudience(personaSession.persona)
                      ? (() => {
                          const ids = (personaSession.persona as CustomAudienceProfile).filters?.segment_ids ?? [];
                          if (ids.length === 1) {
                            const seg = SEGMENTS.find(s => s.id === Number(ids[0]));
                            if (seg) return seg.color;
                          }
                          return "#6366f1";
                        })()
                      : SEGMENTS.find(s => s.id === personaSession.persona.segment_id)?.color ?? "#8b5cf6";
                  return (
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: sessionColor + "1a", color: sessionColor }}
                    >
                      <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full"
                        style={{ backgroundColor: sessionColor }}
                      />
                      {personaSession.is_digital_twin
                        ? "Digital Twin — Live"
                        : isCustomAudience(personaSession.persona)
                          ? "Custom Audience — Live"
                          : "Segment Persona — Live"}
                    </span>
                  );
                })()
              ) : null}
            </div>
          )}

          <Separator />

          <ScrollArea className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {focusGroupSession ? (
                /* ── Focus Group Active ─────────────────────── */
                <motion.div
                  key="focus-group-active"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="py-3 px-3"
                >
                  <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-foreground">Focus Group</p>
                      <button
                        onClick={onFocusGroupEnd}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="End focus group"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Participant badges */}
                    <div className="flex flex-col gap-1.5 mb-3">
                      {focusGroupSession.participants.map((p, i) => (
                        <div
                          key={p.persona.segment_id}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${
                            focusGroupSession.loading_participant_index === i
                              ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-[10px] font-medium text-foreground truncate flex-1">{p.label}</span>
                          {focusGroupSession.loading_participant_index === i ? (
                            <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                          ) : (
                            !focusGroupSession.is_loading &&
                            focusGroupSession.participants.length > 2 &&
                            onRemoveParticipant && (
                              <button
                                onClick={() => onRemoveParticipant(p.persona.segment_id)}
                                className="rounded-full p-0.5 text-muted-foreground/50 transition-colors hover:text-destructive hover:bg-destructive/10"
                                title={`Remove ${p.label}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Rounds: <span className="font-medium text-foreground">{focusGroupSession.rounds.length}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Voices: <span className="font-medium text-foreground">{focusGroupSession.participants.length}</span>
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={onFocusGroupEnd}
                    >
                      <X className="h-3 w-3" />
                      End Focus Group
                    </Button>
                  </div>
                </motion.div>
              ) : personaSession ? (
                /* ── Active Interview ─────────────────────────── */
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="py-3"
                >
                  <ActivePersonaCard
                    persona={personaSession.persona}
                    session={personaSession}
                    messageCount={personaSession.message_count}
                    onEnd={onPersonaEnd}
                    onToggleSimulation={onToggleSimulation}
                    qualEnabled={qualEnabled}
                    savedAudienceCount={savedAudienceCount}
                  />

                  {/* Suggested Questions */}
                  <div className="mt-4 px-4">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                      personaSession.simulation_mode ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    }`}>
                      {personaSession.simulation_mode ? "Scenario prompts" : "Suggested questions"}
                    </p>
                    <div className="mt-2 flex flex-col gap-1.5">
                      {(personaSession.simulation_mode
                        ? (personaSession.is_digital_twin
                          ? [
                              "How would you react if your energy bill doubled?",
                              "What if your workplace went fully sustainable?",
                              "How would you respond to a neighbourhood composting scheme?",
                              "What if your favourite brand was exposed for greenwashing?",
                            ]
                          : isCustomAudience(personaSession.persona)
                            ? [
                                "How would this audience react to a carbon tax on flights?",
                                "What if sustainable products were 20% cheaper?",
                                "How would a social media campaign affect their behaviour?",
                                "What if their employer introduced a green policy?",
                              ]
                            : [
                                "How would this segment react to a carbon tax?",
                                "What if a trusted celebrity endorsed sustainable living?",
                                "How would a community programme change their habits?",
                                "What if sustainable products became the default option?",
                              ]
                        )
                        : (personaSession.is_digital_twin
                          ? [
                              "What does sustainability mean to you personally?",
                              "What stops you from living more sustainably?",
                              "What would motivate you to change your behaviour?",
                              "Tell me about the actions you already take.",
                            ]
                          : isCustomAudience(personaSession.persona)
                            ? [
                                "What does sustainability mean to this audience?",
                                "What are the main barriers this audience faces?",
                                "What motivates this audience to act?",
                                "How concerned is this audience about climate change?",
                              ]
                            : [
                                "What does sustainability mean to this segment?",
                                "What are the main barriers this segment faces?",
                                "What motivates this segment to act?",
                                "How does this segment compare to others?",
                              ]
                        )
                      ).map((q) => (
                        <button
                          key={q}
                          onClick={() => onSendQuestion?.(q)}
                          className={`rounded-md border px-3 py-2 text-left text-[11px] text-foreground transition-colors ${
                            personaSession.simulation_mode
                              ? "border-amber-500/20 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              : personaSession.is_digital_twin
                                ? "border-cyan-500/20 hover:bg-cyan-50 dark:hover:bg-cyan-950/20"
                                : "border-border hover:bg-accent"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phase 41b: Respondent Browser — only for Custom Audience sessions, not in twin mode */}
                  {isCustomAudience(personaSession.persona) && !personaSession.is_digital_twin && (
                    <RespondentBrowser
                      filters={(personaSession.persona as CustomAudienceProfile).filters}
                      onActivateTwin={handleActivateTwin}
                    />
                  )}

                  {/* Error display */}
                  {error && (
                    <div className="mx-4 mt-2 rounded-md bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                      {error}
                    </div>
                  )}
                </motion.div>
              ) : (
                /* ── Selection: Segments / Build Audience tabs ── */
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {/* How It Works — methodology transparency card */}
                  <HowItWorksCard qualEnabled={qualEnabled} />

                  {/* Phase 41a + 44b: Tab switcher */}
                  <div className="mx-3 mt-2 flex rounded-lg bg-muted p-0.5">
                    <button
                      onClick={() => setActiveTab("segments")}
                      className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        activeTab === "segments"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Segments
                    </button>
                    <button
                      onClick={() => setActiveTab("audience")}
                      className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        activeTab === "audience"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Custom Audience
                    </button>
                    <button
                      onClick={() => setActiveTab("focus-group")}
                      className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        activeTab === "focus-group"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Focus Group
                    </button>
                  </div>

                  {activeTab === "segments" ? (
                    <div className="p-3">
                      <p className="mb-3 text-xs text-muted-foreground">
                        Explore a segment&apos;s collective perspective from the 2025 Study.
                        Select a segment to begin.
                      </p>

                      {/* Segment cards */}
                      <div className="flex flex-col gap-2">
                        {liveSegments.map((seg) => (
                          <SegmentCard
                            key={seg.id}
                            segment={seg}
                            selected={selectedSegment === seg.id}
                            onClick={() => setSelectedSegment(seg.id)}
                            qualEnabled={qualEnabled}
                          />
                        ))}
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                          {error}
                        </div>
                      )}
                    </div>
                  ) : activeTab === "audience" ? (
                    <AudienceBuilder onExplore={handleAudienceExplore} />
                  ) : (
                    <FocusGroupSetup
                      onStart={(participants, topic, country) => onFocusGroupStart?.(participants, topic, country)}
                      qualEnabled={qualEnabled}
                      segments={liveSegments}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Footer action (only for segments tab — audience tab has its own button) */}
          {!personaSession && activeTab === "segments" && (
            <div className="border-t border-border p-3">
              <Button
                size="sm"
                className="w-full gap-2 text-xs"
                disabled={selectedSegment === null || loading}
                onClick={handleStartInterview}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageCircle className="h-3.5 w-3.5" />
                )}
                {loading ? "Loading segment..." : "Explore Segment"}
              </Button>
            </div>
          )}
        </>
      )}
    </motion.aside>
  );
}
