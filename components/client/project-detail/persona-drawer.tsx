"use client"

import { useState } from "react"
import {
  CircleHelp,
  FileImage,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Headphones,
  Layers3,
  Monitor,
  Tv,
  X,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

/** UI-only mock; move to `lib/types.ts` when wiring the research agent. */
export type PersonaMock = {
  id: string
  segmentCode: string
  title: string
  shortDescription: string
  dotClassName: string
  surveyN: number
  surveyPctLabel: string
  avgConcern: string
  avgActions: string
  messageCount: number
  voiceQuote: string
  interviews: { quote: string; speaker: string }[]
  barriers: { label: string; pct: string }[]
  suggestedQuestions: string[]
}

export const MOCK_SEGMENT_PERSONAS: PersonaMock[] = [
  {
    id: "seg-do-nothing",
    segmentCode: "S1",
    title: "The Do Nothing-ers",
    shortDescription:
      "Very low concern level for sustainability. Actively doing very few sustainable behaviours.",
    dotClassName: "bg-red-500",
    surveyN: 66,
    surveyPctLabel: "6.6%",
    avgConcern: "2.1/10",
    avgActions: "0.8",
    messageCount: 0,
    voiceQuote:
      "I don’t really think about it day to day — if it’s easy I might, but I’m not changing my routine.",
    interviews: [
      {
        quote: "Recycling feels like extra hassle when bins aren’t right outside the door.",
        speaker: "UK, 34, urban",
      },
      {
        quote: "I’ll buy what’s cheapest; ‘sustainable’ often sounds more expensive.",
        speaker: "UK, 41, suburban",
      },
    ],
    barriers: [
      { label: "Cost vs. perceived benefit", pct: "28.4%" },
      { label: "Low personal relevance", pct: "22.0%" },
      { label: "Habit / convenience", pct: "18.7%" },
    ],
    suggestedQuestions: [
      "What does sustainability mean to this segment?",
      "What would nudge them toward one small behaviour change?",
      "How do they compare price vs. eco labels?",
    ],
  },
  {
    id: "seg-minimalists",
    segmentCode: "S2",
    title: "The Minimalists",
    shortDescription:
      "Low concern level for sustainability. Doing few sustainable behaviours.",
    dotClassName: "bg-orange-500",
    surveyN: 112,
    surveyPctLabel: "11.1%",
    avgConcern: "3.8/10",
    avgActions: "1.6",
    messageCount: 0,
    voiceQuote:
      "I’ll do the basics if it’s not disruptive — turn off lights, maybe reuse a bag sometimes.",
    interviews: [
      {
        quote: "I know I should do more but I pick my battles.",
        speaker: "KSA, 29",
      },
    ],
    barriers: [
      { label: "Time and effort", pct: "24.1%" },
      { label: "Trust in brand claims", pct: "19.3%" },
      { label: "Competing priorities", pct: "16.2%" },
    ],
    suggestedQuestions: [
      "Which sustainable actions feel ‘easy enough’ for them?",
      "What erodes trust in green messaging?",
    ],
  },
  {
    id: "seg-muddled-middle",
    segmentCode: "S3",
    title: "The Muddled Middle Majority",
    shortDescription:
      "Medium concern level for sustainability. Doing some sustainable behaviours but feeling overwhelmed.",
    dotClassName: "bg-violet-600",
    surveyN: 508,
    surveyPctLabel: "50.4%",
    avgConcern: "6.55/10",
    avgActions: "3.9",
    messageCount: 0,
    voiceQuote:
      "I want to do the right thing, but it’s confusing — too many labels, too much conflicting advice.",
    interviews: [
      {
        quote: "I try to recycle properly but I’m never sure what goes in which bin.",
        speaker: "UK, 38, parent",
      },
      {
        quote: "Sometimes I pay more for ‘greener’ options, then wonder if it actually helps.",
        speaker: "UK, 45",
      },
    ],
    barriers: [
      { label: "Lack of information", pct: "19.1%" },
      { label: "Overwhelm / choice fatigue", pct: "17.4%" },
      { label: "Price sensitivity", pct: "14.8%" },
    ],
    suggestedQuestions: [
      "What does sustainability mean to this segment?",
      "What barriers stop them from doing more?",
      "How do they interpret eco labels and claims?",
    ],
  },
  {
    id: "seg-do-their-bit",
    segmentCode: "S4",
    title: "Do Their Bit for Others",
    shortDescription:
      "High concern level for sustainability. Actively doing a lot of sustainable behaviours.",
    dotClassName: "bg-teal-500",
    surveyN: 240,
    surveyPctLabel: "23.8%",
    avgConcern: "8.4/10",
    avgActions: "6.2",
    messageCount: 0,
    voiceQuote:
      "It matters for my kids’ future — I’ll adjust what I buy, how I travel, and what I support.",
    interviews: [
      {
        quote: "I look for B Corp or strong credentials before I switch brands.",
        speaker: "UK, 33",
      },
    ],
    barriers: [
      { label: "Greenwashing / scepticism", pct: "21.0%" },
      { label: "Limited affordable premium options", pct: "15.2%" },
      { label: "Infrastructure gaps (charging, recycling)", pct: "12.9%" },
    ],
    suggestedQuestions: [
      "What proof do they need before they advocate a brand?",
      "Where do they still feel stuck despite high intent?",
    ],
  },
]

type EmptyPaneProps = {
  title: string
  variant?: "default" | "studio"
}

const STUDIO_ITEMS = [
  { label: "Podcast Summary", Icon: Headphones },
  { label: "Flashcards", Icon: Layers3 },
  { label: "Quiz", Icon: CircleHelp },
  { label: "Mind Map", Icon: GitBranch },
  { label: "Video Overview", Icon: Tv },
  { label: "Written Report (PDF)", Icon: FileText },
  { label: "Infographic", Icon: FileImage },
  { label: "Slide Deck (PPT)", Icon: Monitor },
  { label: "Data Tables (XLS)", Icon: FileSpreadsheet },
]

export function EmptyPane({ title, variant = "default" }: EmptyPaneProps) {
  if (variant === "studio") {
    return (
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border-2 border-dashed border-arse-black/15 bg-arse-black/[0.02] px-3 py-4">
        <p className="text-left font-arse-body text-[11px] leading-relaxed text-arse-black/45">
          <b>Coming Soon</b> <br></br>The tools below are being built and will be launching soon. Talk to your
          Disrupt team if you need them.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {STUDIO_ITEMS.map((item) => (
            <div
              key={item.label}
              aria-disabled
              className="relative flex min-h-20 flex-col items-center justify-center rounded-xl border border-arse-black/10 bg-arse-black/[0.015] px-1.5 py-2 text-center opacity-45"
            >
              <item.Icon className="h-4 w-4 text-arse-black/45" aria-hidden />
              <p className="mt-1 font-arse-body text-[10px] leading-tight text-arse-black/55">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-arse-black/15 bg-arse-black/[0.02] px-4 py-6 text-center sm:py-10">
      <p className="font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black/50">
        {title}
      </p>
      <p className="mt-2 font-arse-body text-sm text-arse-black/45">
        Coming soon — content will appear here after client approval.
      </p>
    </div>
  )
}

function SegmentListCard({
  persona,
  selected,
  onSelect,
}: {
  persona: PersonaMock
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border-2 bg-white p-4 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
        selected
          ? "border-arse-pink shadow-[3px_3px_0_0_var(--arse-pink)]"
          : "border-arse-black/15 hover:border-arse-black/35"
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn("mt-1 h-3 w-3 shrink-0 rounded-full", persona.dotClassName)}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-arse-title text-sm font-bold text-arse-black">{persona.title}</p>
          <p className="mt-1 font-arse-body text-xs leading-relaxed text-arse-black/60">
            {persona.shortDescription}
          </p>
          <p className="mt-2 font-arse-body text-[11px] text-arse-black/45">
            Survey n={persona.surveyN} ({persona.surveyPctLabel})
          </p>
          <p className="mt-2 font-arse-body text-xs font-semibold text-emerald-600">
            + Interview voices
          </p>
        </div>
      </div>
    </button>
  )
}

function PersonaDetailCard({
  persona,
  onEndSession,
}: {
  persona: PersonaMock
  onEndSession?: () => void
}) {
  const [whatIf, setWhatIf] = useState(false)

  return (
    <div className="rounded-2xl border-2 border-arse-black/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-arse-black/20 font-arse-title text-[10px] font-bold text-arse-black",
              persona.dotClassName,
              "text-white"
            )}
            aria-hidden
          >
            {persona.segmentCode}
          </span>
          <div className="min-w-0">
            <h3 className="font-arse-title text-sm font-bold leading-tight text-arse-black">
              {persona.title}
            </h3>
            <p className="mt-1 font-arse-body text-xs leading-relaxed text-arse-black/65">
              {persona.shortDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: "Avg concern", value: persona.avgConcern },
          { label: "Avg actions", value: persona.avgActions },
          {
            label: "Survey",
            value: `n=${persona.surveyN} (${persona.surveyPctLabel})`,
          },
          { label: "Messages", value: String(persona.messageCount) },
        ].map((cell) => (
          <div
            key={cell.label}
            className="rounded-xl border border-arse-black/10 bg-arse-black/[0.02] px-3 py-2"
          >
            <p className="font-arse-title text-[9px] font-bold uppercase tracking-wide text-arse-black/45">
              {cell.label}
            </p>
            <p className="mt-0.5 font-arse-body text-xs font-semibold text-arse-black">
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-arse-black/10 px-3 py-2">
        <span className="font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/70">
          What-If mode
        </span>
        <Switch
          checked={whatIf}
          onCheckedChange={setWhatIf}
          aria-label="Toggle what-if mode"
        />
      </div>

      <div className="mt-4 space-y-3 border-t border-arse-black/10 pt-4">
        <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/45">
          Voice from this segment
        </p>
        <p className="font-arse-body text-sm italic leading-relaxed text-arse-black/80">
          “{persona.voiceQuote}”
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <p className="font-arse-title text-[10px] font-bold uppercase tracking-wide text-emerald-600">
          From in-depth interviews
        </p>
        <ul className="space-y-2">
          {persona.interviews.map((row, i) => (
            <li key={i} className="font-arse-body text-xs leading-relaxed text-arse-black/75">
              <span className="text-arse-black">“{row.quote}”</span>{" "}
              <span className="text-arse-black/50">— {row.speaker}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/45">
          Top barriers
        </p>
        <ul className="mt-2 space-y-1.5">
          {persona.barriers.map((b) => (
            <li
              key={b.label}
              className="flex justify-between gap-2 font-arse-body text-xs text-arse-black/80"
            >
              <span>{b.label}</span>
              <span className="shrink-0 font-semibold text-arse-black/60">{b.pct}</span>
            </li>
          ))}
        </ul>
      </div>

      {onEndSession ? (
        <button
          type="button"
          onClick={onEndSession}
          className="mt-4 w-full rounded-xl border-2 border-arse-black/15 bg-white py-2.5 font-arse-title text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
        >
          End session
        </button>
      ) : null}
    </div>
  )
}

export function PersonaPanel({
  appliedPersona,
  onApply,
  onClearPersona,
  /** Mobile overlay only — header dismiss (X). */
  onClose,
  className,
}: {
  appliedPersona: PersonaMock | null
  onApply: (personaId: string) => void
  onClearPersona?: () => void
  onClose?: () => void
  className?: string
}) {
  return (
    <aside
      className={cn(
        "flex min-h-0 h-full w-full min-w-0 flex-col  bg-white",
        className
      )}
      aria-label="Persona"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-arse-black/10 px-0 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black">
            Personas
          </p>
          <p className="font-arse-body text-[11px] text-arse-black/50">
            Choose how smartA.R.S.E speaks to you.
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-arse-black/15 bg-white text-arse-black transition hover:border-arse-pink hover:bg-arse-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
            aria-label="Close persona panel"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      {appliedPersona ? (
        <div className="shrink-0 border-b border-arse-black/10 py-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-arse-black/10 bg-arse-black/[0.03] pl-2.5 pr-1 py-1 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/70">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Live segment</span>
            {onClearPersona ? (
              <button
                type="button"
                onClick={onClearPersona}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-arse-black/50 transition hover:bg-arse-black/10 hover:text-arse-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
                aria-label="End live segment"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Tabs
        defaultValue="segments"
        className="flex min-h-0 flex-1 flex-col overflow-hidden py-2"
      >
        <TabsList className="grid h-auto w-full shrink-0 grid-cols-3 gap-0 rounded-xl bg-arse-black/[0.04]">
          <TabsTrigger
            value="segments"
            className={cn(
              "rounded-lg px-1.5 py-2 font-arse-title text-[10px] font-bold uppercase leading-tight text-arse-black/55",
              "data-[state=active]:border-2 data-[state=active]:border-arse-black/15 data-[state=active]:bg-white data-[state=active]:text-arse-black data-[state=active]:shadow-sm"
            )}
          >
            Segments
          </TabsTrigger>
          <TabsTrigger
            value="audience"
            className={cn(
              "rounded-lg px-1.5 py-2 font-arse-title text-[10px] font-bold uppercase leading-tight text-arse-black/55",
              "data-[state=active]:border-2 data-[state=active]:border-arse-black/15 data-[state=active]:bg-white data-[state=active]:text-arse-black data-[state=active]:shadow-sm"
            )}
          >
            Audience
          </TabsTrigger>
          <TabsTrigger
            value="focus"
            className={cn(
              "rounded-lg px-1.5 py-2 font-arse-title text-[10px] font-bold uppercase leading-tight text-arse-black/55",
              "data-[state=active]:border-2 data-[state=active]:border-arse-black/15 data-[state=active]:bg-white data-[state=active]:text-arse-black data-[state=active]:shadow-sm"
            )}
          >
            Focus grp
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="segments"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-0 data-[state=inactive]:hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {appliedPersona ? (
            <>
              <PersonaDetailCard persona={appliedPersona} onEndSession={onClearPersona} />
              <div>
                <p className="mb-2 font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/45">
                  Suggested questions
                </p>
                <div className="flex flex-col gap-2">
                  {appliedPersona.suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="rounded-xl border-2 border-arse-black/15 bg-arse-black/[0.02] px-3 py-2 text-left font-arse-body text-xs text-arse-black/80 transition hover:border-arse-pink/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {MOCK_SEGMENT_PERSONAS.map((p) => (
                  <SegmentListCard
                    key={p.id}
                    persona={p}
                    selected={false}
                    onSelect={() => onApply(p.id)}
                  />
                ))}
              </div>
            </>
          )}
          </div>
        </TabsContent>

        <TabsContent
          value="audience"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-0 data-[state=inactive]:hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <EmptyPane title="Audience" />
          </div>
        </TabsContent>

        <TabsContent
          value="focus"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-0 data-[state=inactive]:hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <EmptyPane title="Focus group" />
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}

export function PersonaDrawer({
  open,
  onClose,
  appliedPersona,
  onApply,
  onClearPersona,
}: {
  open: boolean
  onClose?: () => void
  appliedPersona: PersonaMock | null
  onApply: (personaId: string) => void
  onClearPersona?: () => void
}) {
  if (!open) return null
  return (
    <PersonaPanel
      appliedPersona={appliedPersona}
      onApply={onApply}
      onClearPersona={onClearPersona}
      onClose={onClose}
    />
  )
}
