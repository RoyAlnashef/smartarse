"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronLeft,
  CircleHelp,
  Compass,
  FileImage,
  FileSpreadsheet,
  FileText,
  Gauge,
  GitBranch,
  Headphones,
  Info,
  Layers3,
  Monitor,
  Pencil,
  Plus,
  Trash2,
  Tv,
  Users,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { MAX_SAVED_CUSTOM_AUDIENCES_PER_USER } from "@/lib/audience/constants"
import {
  isArchivedCustomAudienceId,
  isDraftCustomAudienceId,
} from "@/lib/chat-restore-custom-audience"
import type {
  FocusGroupCountryContext,
  FocusGroupSession,
  SavedCustomAudience,
} from "@/lib/types"
import {
  chatToneForSavedCustomAudience,
  dominantSegmentPersonaIdFromChildSegmentIds,
} from "@/lib/theme/custom-audience-dominant-persona"
import { personaChatToneFromCiteToken } from "@/lib/theme/persona-chat-tone"
import { FOCUS_GROUP_CREDIT_COST_PER_PARTICIPANT } from "@/lib/credits"
import { savedCustomAudienceStackDisplayTokens } from "@/lib/theme/custom-audience-display-tokens"
import type { PersonaMock } from "@/lib/personas/segment-mocks"
import { MOCK_SEGMENT_PERSONAS } from "@/lib/personas/segment-mocks"
import {
  SEGMENT_BRAND_DEFAULT_COLOR_TOKEN,
  citeColorDotFillStyle,
  isCiteColorDotFillToken,
  isCiteColorToken,
} from "@/lib/theme/cite-color-tokens"

export type { PersonaMock } from "@/lib/personas/segment-mocks"
export { MOCK_SEGMENT_PERSONAS } from "@/lib/personas/segment-mocks"

const SegmentPersonasContext = createContext<PersonaMock[]>(MOCK_SEGMENT_PERSONAS)

type AudienceBuilderDraft = {
  segmentIds: string[]
  country: "uk" | "ksa" | "all"
  gender: "male" | "female" | "all"
  ageRange: [number, number]
  concernRange: [number, number]
}

function draftToSnapshot(draft: AudienceBuilderDraft, segments: PersonaMock[]) {
  return {
    filters: {
      segment_ids: draft.segmentIds,
      country: draft.country === "all" ? null : draft.country,
      gender: draft.gender === "all" ? null : draft.gender,
      age_min: draft.ageRange[0],
      age_max: draft.ageRange[1],
      concern_min: draft.concernRange[0],
      concern_max: draft.concernRange[1],
    },
    childSegments: segments
      .filter((persona) => draft.segmentIds.includes(persona.id))
      .map((persona) => ({
        id: persona.id,
        name: persona.title,
        colorToken: persona.colorCiteToken,
      })),
  }
}

function snapshotToDraft(
  snapshot: SavedCustomAudience["snapshot"] | null
): AudienceBuilderDraft | null {
  if (!snapshot) return null
  const filters = (snapshot.filters ?? {}) as Record<string, unknown>
  const segmentIds = Array.isArray(filters.segment_ids)
    ? filters.segment_ids.filter((v): v is string => typeof v === "string")
    : []
  const countryRaw = filters.country
  const genderRaw = filters.gender
  const ageMin = Number(filters.age_min)
  const ageMax = Number(filters.age_max)
  const concernMin = Number(filters.concern_min)
  const concernMax = Number(filters.concern_max)
  return {
    segmentIds:
      segmentIds.length > 0
        ? segmentIds
        : MOCK_SEGMENT_PERSONAS.map((persona) => persona.id),
    country:
      countryRaw === "uk" || countryRaw === "ksa"
        ? countryRaw
        : "all",
    gender:
      genderRaw === "male" || genderRaw === "female"
        ? genderRaw
        : "all",
    ageRange: [
      Number.isFinite(ageMin) ? Math.max(18, Math.min(75, ageMin)) : 18,
      Number.isFinite(ageMax) ? Math.max(18, Math.min(75, ageMax)) : 75,
    ],
    concernRange: [
      Number.isFinite(concernMin) ? Math.max(1, Math.min(10, concernMin)) : 1,
      Number.isFinite(concernMax) ? Math.max(1, Math.min(10, concernMax)) : 10,
    ],
  }
}

function customAudienceDotClass(colorToken: string | null | undefined): string {
  switch ((colorToken ?? "").trim()) {
    case "arse-pink":
      return "bg-arse-pink"
    case "pink-500":
      return "bg-pink-500"
    case "indigo-500":
      return "bg-indigo-500"
    case "sky-500":
      return "bg-sky-500"
    case "violet-500":
      return "bg-violet-500"
    case "violet-600":
      return "bg-violet-600"
    case "yellow-500":
      return "bg-yellow-500"
    default:
      return "bg-arse-pink"
  }
}

const FALLBACK_CUSTOM_AUDIENCE_QUESTIONS = [
  "What does sustainability mean to this audience?",
  "What are the main barriers this audience faces?",
  "What motivates this audience to act?",
  "How concerned is this audience about climate change?",
]

function dominantPersonaForDraft(
  draft: AudienceBuilderDraft,
  segments: PersonaMock[]
): PersonaMock | null {
  const dominantId = dominantSegmentPersonaIdFromChildSegmentIds(draft.segmentIds)
  return dominantId ? (segments.find((persona) => persona.id === dominantId) ?? null) : null
}

function estimateCustomAudienceNFromDraft(draft: AudienceBuilderDraft, segments: PersonaMock[]): number {
  const selected = segments.filter((persona) => draft.segmentIds.includes(persona.id))
  const baseN = selected.reduce((total, persona) => total + persona.surveyN, 0)
  if (!baseN) return 0
  let reductionFactor = 1
  if (draft.country !== "all") reductionFactor *= 0.55
  if (draft.gender !== "all") reductionFactor *= 0.62
  reductionFactor *= Math.max(0.12, (draft.ageRange[1] - draft.ageRange[0]) / 57)
  reductionFactor *= Math.max(0.12, (draft.concernRange[1] - draft.concernRange[0]) / 9)
  return Math.max(0, Math.round(baseN * reductionFactor))
}

function weightedAvgActionsFromDraft(draft: AudienceBuilderDraft, segments: PersonaMock[]): string {
  const selected = segments.filter((persona) => draft.segmentIds.includes(persona.id))
  const weighted = selected.reduce(
    (total, persona) => total + Number.parseFloat(persona.avgActions) * persona.surveyN,
    0
  )
  const totalN = selected.reduce((total, persona) => total + persona.surveyN, 0)
  if (!totalN) return "0.0"
  return (weighted / totalN).toFixed(1)
}

function weightedAvgConcernFromDraft(draft: AudienceBuilderDraft, segments: PersonaMock[]): string {
  const selected = segments.filter((persona) => draft.segmentIds.includes(persona.id))
  const weighted = selected.reduce(
    (total, persona) => total + persona.concernScore * persona.surveyN,
    0
  )
  const totalN = selected.reduce((total, persona) => total + persona.surveyN, 0)
  if (!totalN) return "0.0"
  return (weighted / totalN).toFixed(1)
}

const CUSTOM_AUDIENCE_AUTO_NAME_MAX = 300

/** Stored name when the user leaves the name field empty (create flow or draft save). */
function buildAutoGeneratedCustomAudienceName(
  draft: AudienceBuilderDraft,
  audienceN: number,
  avgConcernOneDecimal: string,
  existingNamesLowercase: Set<string> | undefined,
  segments: PersonaMock[]
): string {
  const dominant = dominantPersonaForDraft(draft, segments)
  const primary = (dominant?.title ?? "Custom audience").trim() || "Custom audience"
  let core = `${primary} · n=${audienceN} · avg concern ≈ ${avgConcernOneDecimal}/10`
  const extras: string[] = []
  if (draft.country !== "all") extras.push(draft.country === "uk" ? "UK" : "KSA")
  if (draft.gender !== "all") extras.push(draft.gender === "male" ? "Male" : "Female")
  extras.push(`${draft.ageRange[0]}–${draft.ageRange[1]}`)
  extras.push(`concern ${draft.concernRange[0]}–${draft.concernRange[1]}`)
  const extraJoined = extras.join(" · ")
  if (core.length + 3 + extraJoined.length <= CUSTOM_AUDIENCE_AUTO_NAME_MAX) {
    core = `${core} · ${extraJoined}`
  }
  core = core.slice(0, CUSTOM_AUDIENCE_AUTO_NAME_MAX).trim()

  if (!existingNamesLowercase || existingNamesLowercase.size === 0) {
    return core
  }

  let candidate = core
  let suffix = 2
  while (existingNamesLowercase.has(candidate.toLowerCase())) {
    const bump = ` · ${suffix}`
    candidate = (
      core.slice(0, Math.max(0, CUSTOM_AUDIENCE_AUTO_NAME_MAX - bump.length)) + bump
    ).trim()
    suffix += 1
    if (suffix > 250) {
      const frag = Math.random().toString(36).slice(2, 10)
      candidate = `${core.slice(0, Math.max(0, CUSTOM_AUDIENCE_AUTO_NAME_MAX - frag.length - 3))} · ${frag}`.slice(
        0,
        CUSTOM_AUDIENCE_AUTO_NAME_MAX
      )
      break
    }
  }
  return candidate
}

function surveyLineForLiveAudience(
  audience: SavedCustomAudience,
  draft: AudienceBuilderDraft,
  segments: PersonaMock[]
): string {
  const baseN = segments.filter((persona) => draft.segmentIds.includes(persona.id)).reduce(
    (sum, persona) => sum + persona.surveyN,
    0
  )
  const n =
    audience.baseSize != null && audience.baseSize > 0
      ? audience.baseSize
      : estimateCustomAudienceNFromDraft(draft, segments)
  if (!n) return `n=${n}`
  const pct = Math.min(100, Math.max(0, (n / baseN) * 100)).toFixed(1)
  return `n=${n} (${pct}%)`
}

function customAudienceLiveDescription(audience: SavedCustomAudience, segments: PersonaMock[]): string {
  const fromDb = [audience.filtersSummary, audience.description].find(
    (value) => typeof value === "string" && value.trim().length > 0
  )
  if (fromDb) return fromDb.trim()

  const draft = snapshotToDraft(audience.snapshot)
  if (!draft) return "Custom audience from your saved filters."

  const parts: string[] = []
  if (draft.country !== "all") parts.push(draft.country === "uk" ? "UK" : "KSA")
  if (draft.gender !== "all") parts.push(draft.gender === "male" ? "Male" : "Female")
  parts.push(`Age ${draft.ageRange[0]}–${draft.ageRange[1]}`)
  parts.push(`Concern ${draft.concernRange[0]}–${draft.concernRange[1]}`)
  const names = segments.filter((persona) => draft.segmentIds.includes(persona.id)).map(
    (persona) => persona.title
  )
  if (names.length) parts.push(names.join(" + "))
  return parts.join(" · ")
}

function customAudienceSuggestedQuestions(audience: SavedCustomAudience, segments: PersonaMock[]): string[] {
  const draft = snapshotToDraft(audience.snapshot)
  const dominant = draft ? dominantPersonaForDraft(draft, segments) : null
  const qs = dominant?.suggestedQuestions ?? []
  if (qs.length) {
    return qs.map((question) =>
      question
        .replace(/\bthis segment\b/gi, "this audience")
        .replace(/\bthe segment\b/gi, "this audience")
    )
  }
  return [...FALLBACK_CUSTOM_AUDIENCE_QUESTIONS]
}

function AppliedCustomAudienceChip({
  audience,
  onClear,
}: {
  audience: SavedCustomAudience
  onClear?: () => void
}) {
  const segments = useContext(SegmentPersonasContext)
  const draft = snapshotToDraft(audience.snapshot)
  const dominant = draft ? dominantPersonaForDraft(draft, segments) : null
  const chipTone = dominant
    ? personaChatToneFromCiteToken(dominant.colorCiteToken)
    : chatToneForSavedCustomAudience(audience)

  return (
    <div className="shrink-0 border-b border-arse-black/10 py-2">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border py-1 pl-2.5 pr-1 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black",
          chipTone.cardBorder,
          chipTone.cardBg
        )}
      >
        <span className="inline-flex -space-x-1.5">
          {savedCustomAudienceStackDisplayTokens(audience, segments)
            .slice(0, 4)
            .map((token, index) => (
              <span
                key={`${token}-${index}`}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border border-white",
                  !isCiteColorDotFillToken(token) && customAudienceDotClass(token)
                )}
                style={citeColorDotFillStyle(token)}
              />
            ))}
        </span>
        <span>{audience.name}</span>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink",
              "hover:bg-arse-black/[0.08]"
            )}
            aria-label="Clear custom audience context"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function AppliedFocusGroupChip({
  session,
  onEnd,
  running = false,
}: {
  session: FocusGroupSession
  onEnd?: () => Promise<void> | void
  running?: boolean
}) {
  const historical = session.endedAt != null
  const closeLabel = historical ? "Close focus group" : "End focus group"
  return (
    <div className="shrink-0 border-b border-arse-black/10 py-2">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-arse-black/15 bg-white py-1 pl-2.5 pr-1 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black"
        )}
      >
        <Users className="h-3 w-3 shrink-0" strokeWidth={2.5} />
        <span className="inline-flex -space-x-1.5">
          {session.participants.slice(0, 4).map((p, index) => (
            <span
              key={`${p.personaId}-${index}`}
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-white",
                !isCiteColorDotFillToken(p.colorToken) && customAudienceDotClass(p.colorToken)
              )}
              style={citeColorDotFillStyle(p.colorToken)}
              aria-hidden
            />
          ))}
        </span>
        <span>{historical ? "Focus Group (ended)" : "Focus Group"}</span>
        <span className="ml-1 rounded-full bg-arse-black/[0.07] px-1.5 text-[9px] text-arse-black/70">
          R{session.roundCount} · {session.participants.length} voices
        </span>
        {onEnd ? (
          <button
            type="button"
            onClick={() => {
              void Promise.resolve(onEnd())
            }}
            disabled={running}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink",
              running
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-arse-black/[0.08]"
            )}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function FocusGroupActivePanel({
  session,
  running,
}: {
  session: FocusGroupSession
  running: boolean
}) {
  const historical = session.endedAt != null
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-arse-black/10 bg-arse-black/[0.02] p-3">
      <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
        {historical ? "Focus group ended" : "Focus group in progress"}
      </p>
      <p className="font-arse-body text-sm leading-relaxed text-arse-black/75">
        {historical
          ? "You're viewing a finished focus group. Close it from the chip above to start a new conversation."
          : running
            ? "Participants are responding to your topic. Watch the chat to see each voice in order."
            : "Ask a follow-up question in the chat to start the next round. Each round costs " +
              `${session.participants.length * FOCUS_GROUP_CREDIT_COST_PER_PARTICIPANT} credits.`}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {session.participants.map((p, index) => (
          <span
            key={`${p.personaId}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-arse-black/10 bg-white px-2 py-1 font-arse-body text-[11px] text-arse-black/75"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                !isCiteColorDotFillToken(p.colorToken) && customAudienceDotClass(p.colorToken)
              )}
              style={citeColorDotFillStyle(p.colorToken)}
              aria-hidden
            />
            {p.label}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-arse-black/10 bg-white px-3 py-2 text-xs text-arse-black/70">
        <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
          Initial topic
        </p>
        <p className="mt-1 font-arse-body text-sm text-arse-black/80">
          {session.initialTopic}
        </p>
      </div>
    </div>
  )
}

function CustomAudienceLiveCard({
  audience,
  draftActions,
}: {
  audience: SavedCustomAudience
  draftActions?: {
    onSaveWithName: (name: string) => Promise<SavedCustomAudience | null>
    onEndSession: () => void
    saving: boolean
    saveDisabled: boolean
  }
}) {
  const segments = useContext(SegmentPersonasContext)
  const [savePopoverOpen, setSavePopoverOpen] = useState(false)
  const [saveNameInput, setSaveNameInput] = useState("")
  const saveNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!savePopoverOpen) return
    setSaveNameInput("")
    requestAnimationFrame(() => saveNameInputRef.current?.focus())
  }, [savePopoverOpen])

  const trimmedSaveName = saveNameInput.trim()
  const canSubmitSaveName = trimmedSaveName.length > 0

  const handleConfirmSaveAudience = useCallback(async () => {
    if (!draftActions || !canSubmitSaveName) return
    const saved = await draftActions.onSaveWithName(trimmedSaveName)
    if (saved) {
      setSavePopoverOpen(false)
      setSaveNameInput("")
    }
  }, [draftActions, canSubmitSaveName, trimmedSaveName])

  const canSaveWithExistingExploreName =
    Boolean(audience.exploreNameWasTyped && audience.name.trim())

  const handleSaveAudienceButtonClick = useCallback(() => {
    if (!draftActions || draftActions.saving || draftActions.saveDisabled) return
    const preset = audience.name.trim()
    if (canSaveWithExistingExploreName && preset) {
      void draftActions.onSaveWithName(preset)
      return
    }
    setSavePopoverOpen(true)
  }, [audience.exploreNameWasTyped, audience.name, canSaveWithExistingExploreName, draftActions])

  const draft = snapshotToDraft(audience.snapshot)
  const dominant = draft ? dominantPersonaForDraft(draft, segments) : null
  const tone = dominant
    ? personaChatToneFromCiteToken(dominant.colorCiteToken)
    : {
        cardBorder: "border-arse-black/15",
        cardBg: "bg-white",
        headingText: "text-arse-black/45",
      }

  const avgConcernDisplay =
    audience.avgConcern != null && Number.isFinite(audience.avgConcern)
      ? `${audience.avgConcern.toFixed(1)}/10`
      : draft
        ? `${weightedAvgConcernFromDraft(draft, segments)}/10`
        : "—"

  const avgActionsDisplay = draft ? weightedAvgActionsFromDraft(draft, segments) : "—"
  const surveyValue = draft ? surveyLineForLiveAudience(audience, draft, segments) : `n=${audience.baseSize ?? 0}`

  return (
    <div className={cn("rounded-2xl border-2 p-4 shadow-sm", tone.cardBorder, tone.cardBg)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex shrink-0 -space-x-1.5" aria-hidden>
          {savedCustomAudienceStackDisplayTokens(audience, segments)
            .slice(0, 4)
            .map((token, index) => (
              <span
                key={`${token}-${index}`}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border border-white",
                  !isCiteColorDotFillToken(token) && customAudienceDotClass(token)
                )}
                style={citeColorDotFillStyle(token)}
              />
            ))}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-arse-title text-sm font-bold leading-tight text-arse-black">{audience.name}</h3>
          <p className="mt-1 font-arse-body text-xs leading-relaxed text-arse-black/65">
            {customAudienceLiveDescription(audience, segments)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: "Avg concern", value: avgConcernDisplay },
          { label: "Avg actions", value: avgActionsDisplay },
          { label: "Survey", value: surveyValue },
        ].map((cell) => (
          <div
            key={cell.label}
            className="rounded-xl border border-arse-black/10 bg-arse-black/[0.02] px-3 py-2"
          >
            <p className="font-arse-title text-[9px] font-bold uppercase tracking-wide text-arse-black/45">
              {cell.label}
            </p>
            <p className="mt-0.5 font-arse-body text-xs font-semibold text-arse-black">{cell.value}</p>
          </div>
        ))}
      </div>

      {draftActions ? (
        <div className="mt-4 flex w-full gap-2 border-t border-arse-black/10 pt-4">
          <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
            <PopoverAnchor asChild>
              <button
                type="button"
                onClick={handleSaveAudienceButtonClick}
                disabled={draftActions.saving || draftActions.saveDisabled}
                className={cn(
                  "inline-flex min-h-[2.5rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-arse-black px-3 py-2 font-arse-title text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-arse-black/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                <Bookmark className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.5} aria-hidden />
                {draftActions.saving ? "Saving..." : "Save this audience"}
              </button>
            </PopoverAnchor>
            <PopoverContent
              align="center"
              side="top"
              sideOffset={8}
              className="w-[min(calc(100vw-1.5rem),20rem)] rounded-2xl border-2 border-arse-black/10 p-4 shadow-lg"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 font-arse-title text-sm font-bold leading-snug text-arse-black">
                    Save this audience
                  </p>
                  <button
                    type="button"
                    onClick={() => setSavePopoverOpen(false)}
                    disabled={draftActions.saving}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-arse-black/60 transition hover:bg-arse-black/[0.06] hover:text-arse-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink disabled:opacity-40"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div>
                  <Label htmlFor="save-draft-audience-name" className="sr-only">
                    Name your custom audience
                  </Label>
                  <Input
                    id="save-draft-audience-name"
                    ref={saveNameInputRef}
                    value={saveNameInput}
                    onChange={(e) => setSaveNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmitSaveName && !draftActions.saving) {
                        e.preventDefault()
                        void handleConfirmSaveAudience()
                      }
                    }}
                    placeholder="Enter a name..."
                    disabled={draftActions.saving}
                    autoComplete="off"
                    className="rounded-xl border-arse-black/20 font-arse-body text-sm"
                  />
                </div>
                <p className="font-arse-body text-[11px] leading-snug text-arse-black/50">Required to save a custom audience.</p>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="font-arse-title text-xs font-semibold text-arse-black/70"
                    onClick={() => setSavePopoverOpen(false)}
                    disabled={draftActions.saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="min-w-[4.5rem] rounded-xl font-arse-title text-xs font-bold disabled:pointer-events-none disabled:opacity-40"
                    disabled={!canSubmitSaveName || draftActions.saving}
                    onClick={() => void handleConfirmSaveAudience()}
                  >
                    {draftActions.saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={draftActions.onEndSession}
            disabled={draftActions.saving}
            className={cn(
              "min-h-[2.5rem] min-w-0 flex-1 rounded-xl border-2 border-arse-black/15 bg-white px-3 py-2 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black transition hover:border-arse-black/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
              draftActions.saving && "cursor-not-allowed opacity-50"
            )}
          >
            End session
          </button>
        </div>
      ) : null}

      {dominant ? (
        <div className="mt-4 space-y-3 border-t border-arse-black/10 pt-4">
          <p
            className={cn(
              "font-arse-title text-[10px] font-bold uppercase tracking-[0.2em]",
              tone.headingText
            )}
          >
            Voice from this segment
          </p>
          <p className="font-arse-body text-sm italic leading-relaxed text-arse-black/80">
            “{dominant.voiceQuote}”
          </p>
          <p className="font-arse-body text-xs leading-relaxed text-arse-black/55">- {dominant.voiceReference}</p>
        </div>
      ) : null}
    </div>
  )
}

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
  disabled = false,
}: {
  persona: PersonaMock
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border bg-white p-4 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-55 hover:border-arse-black/15",
        selected
          ? "border-arse-black/20 shadow-sm"
          : "border-arse-black/15 hover:border-arse-black/30"
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "mt-1 h-3 w-3 shrink-0 rounded-full",
            !isCiteColorDotFillToken(persona.colorCiteToken) && persona.dotClassName
          )}
          style={citeColorDotFillStyle(persona.colorCiteToken)}
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
        </div>
      </div>
    </button>
  )
}

function PersonaDetailCard({
  persona,
}: {
  persona: PersonaMock
}) {
  const chatTone = personaChatToneFromCiteToken(persona.colorCiteToken)

  return (
    <div className={cn("rounded-2xl border-2 p-4 shadow-sm", chatTone.cardBorder, chatTone.cardBg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-arse-title text-sm font-bold leading-tight text-arse-black">
            {persona.title}
          </h3>
          <p className="mt-1 font-arse-body text-xs leading-relaxed text-arse-black/65">
            {persona.shortDescription}
          </p>
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

      <div className="mt-4 space-y-3 border-t border-arse-black/10 pt-4">
        <p
          className={cn(
            "font-arse-title text-[10px] font-bold uppercase tracking-[0.2em]",
            chatTone.headingText
          )}
        >
          Voice from this segment
        </p>
        <p className="font-arse-body text-sm italic leading-relaxed text-arse-black/80">
          “{persona.voiceQuote}”
        </p>
        <p className="font-arse-body text-xs leading-relaxed text-arse-black/55">
          - {persona.voiceReference}
        </p>
      </div>

    </div>
  )
}

const personaSubTabListClass =
  "grid h-auto w-full shrink-0 grid-cols-3 items-stretch gap-0.5 rounded-xl bg-arse-black/[0.04] p-0.5"

const personaSubTabTriggerClass =
  "min-w-0 h-auto whitespace-normal rounded-lg px-1 py-2 text-center font-arse-title text-[10px] font-bold uppercase leading-tight text-arse-black/55 data-[state=active]:border-2 data-[state=active]:border-arse-black/15 data-[state=active]:bg-white data-[state=active]:text-arse-black data-[state=active]:shadow-sm"

export function PersonaPanel({
  appliedPersona,
  appliedCustomAudience,
  appliedFocusGroup = null,
  projectId,
  onApply,
  onApplyCustomAudience,
  onClearPersona,
  onClearCustomAudience,
  onReplaceAppliedCustomAudience,
  onPromoteDraftExploreThread,
  onStartFocusGroup,
  onEndFocusGroup,
  focusGroupRunning = false,
  onSuggestedQuestionSelect,
  personaLocked = false,
  disabled = false,
  /** Mobile overlay only — header dismiss (X). */
  onClose,
  className,
  /** Resolved study segments (mock + optional `project_personas` overrides). */
  segmentPersonas = MOCK_SEGMENT_PERSONAS,
  onSavedAudiencesHydrated,
  onSavedAudienceUpsert,
  onSavedAudienceDeleted,
}: {
  appliedPersona: PersonaMock | null
  appliedCustomAudience: SavedCustomAudience | null
  appliedFocusGroup?: FocusGroupSession | null
  projectId: string
  onApply: (personaId: string) => void
  onApplyCustomAudience: (audience: SavedCustomAudience) => void
  onClearPersona?: () => void
  onClearCustomAudience?: () => void
  onReplaceAppliedCustomAudience?: (audience: SavedCustomAudience) => void
  onPromoteDraftExploreThread?: (audience: SavedCustomAudience) => void
  onStartFocusGroup?: (
    personaIds: readonly string[],
    country: FocusGroupCountryContext,
    topic: string
  ) => Promise<void> | void
  onEndFocusGroup?: () => Promise<void> | void
  focusGroupRunning?: boolean
  onSuggestedQuestionSelect?: (question: string) => void
  personaLocked?: boolean
  disabled?: boolean
  onClose?: () => void
  className?: string
  segmentPersonas?: PersonaMock[]
  onSavedAudiencesHydrated?: (audiences: SavedCustomAudience[]) => void
  onSavedAudienceUpsert?: (audience: SavedCustomAudience) => void
  onSavedAudienceDeleted?: (audienceId: string) => void
}) {
  const [audienceSegmentIds, setAudienceSegmentIds] = useState<string[]>(() =>
    segmentPersonas.map((persona) => persona.id)
  )
  const [country, setCountry] = useState<"uk" | "ksa" | "all">("all")
  const [gender, setGender] = useState<"male" | "female" | "all">("all")
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 75])
  const [concernRange, setConcernRange] = useState<[number, number]>([1, 10])
  const [focusParticipantIds, setFocusParticipantIds] = useState<string[]>([])
  const [focusCountryContext, setFocusCountryContext] = useState<"uk" | "ksa" | "both">("both")
  const [focusTopic, setFocusTopic] = useState("")
  const [activePersonaTab, setActivePersonaTab] = useState<"segments" | "audience" | "focus">("segments")
  const [savedAudiences, setSavedAudiences] = useState<SavedCustomAudience[]>([])
  const [savedAudiencesLoading, setSavedAudiencesLoading] = useState(false)
  const [savedAudiencesError, setSavedAudiencesError] = useState<string | null>(null)
  const [audienceView, setAudienceView] = useState<"list" | "detail">("list")
  const [editingAudienceId, setEditingAudienceId] = useState<string | null>(null)
  const [audienceNameDraft, setAudienceNameDraft] = useState("")
  const [audienceSaving, setAudienceSaving] = useState(false)
  const [deletingAudienceId, setDeletingAudienceId] = useState<string | null>(null)
  const hasSavedAudiences = savedAudiences.length > 0
  const atSavedAudienceCap = savedAudiences.length >= MAX_SAVED_CUSTOM_AUDIENCES_PER_USER
  const audienceListEmpty =
    !savedAudiencesLoading && !hasSavedAudiences && !savedAudiencesError
  const showAudienceDetail = audienceView === "detail"

  const selectedAudienceSegments = useMemo(
    () => segmentPersonas.filter((persona) => audienceSegmentIds.includes(persona.id)),
    [audienceSegmentIds, segmentPersonas]
  )

  const customAudienceN = useMemo(() => {
    const baseN = selectedAudienceSegments.reduce((total, persona) => total + persona.surveyN, 0)
    if (!baseN) return 0
    let reductionFactor = 1
    if (country !== "all") reductionFactor *= 0.55
    if (gender !== "all") reductionFactor *= 0.62
    reductionFactor *= Math.max(0.12, (ageRange[1] - ageRange[0]) / 57)
    reductionFactor *= Math.max(0.12, (concernRange[1] - concernRange[0]) / 9)
    return Math.max(0, Math.round(baseN * reductionFactor))
  }, [ageRange, concernRange, country, gender, selectedAudienceSegments])

  const customAudienceAvgConcern = useMemo(() => {
    const weightedConcern = selectedAudienceSegments.reduce(
      (total, persona) => total + persona.concernScore * persona.surveyN,
      0
    )
    const totalN = selectedAudienceSegments.reduce((total, persona) => total + persona.surveyN, 0)
    if (!totalN) return "0.0"
    return (weightedConcern / totalN).toFixed(1)
  }, [selectedAudienceSegments])

  const focusParticipants = useMemo(
    () => segmentPersonas.filter((persona) => focusParticipantIds.includes(persona.id)),
    [focusParticipantIds, segmentPersonas]
  )
  const canStartFocusGroup =
    focusParticipants.length >= 2 && focusParticipants.length <= 4 && focusTopic.trim().length > 0
  const appliedPersonaChatTone = appliedPersona
    ? personaChatToneFromCiteToken(appliedPersona.colorCiteToken)
    : null
  const personaContextActive = Boolean(appliedPersona)
  const customAudienceContextActive = Boolean(appliedCustomAudience)
  const focusGroupContextActive = Boolean(appliedFocusGroup)
  /** Audience builder/list — locked while a segment is live (custom audience uses a read-only live view instead). */
  const audienceUiDisabled = disabled || personaContextActive

  function handlePersonaTabChange(nextTab: string) {
    if (disabled) return
    if (focusGroupContextActive && nextTab !== "focus") return
    if (personaContextActive && nextTab !== "segments") return
    if (customAudienceContextActive && nextTab === "segments") return
    setActivePersonaTab(nextTab as "segments" | "audience" | "focus")
  }

  useEffect(() => {
    if (focusGroupContextActive) {
      setActivePersonaTab("focus")
      return
    }
    if (personaContextActive) {
      setActivePersonaTab("segments")
      return
    }
    if (customAudienceContextActive) {
      setActivePersonaTab("audience")
    }
  }, [customAudienceContextActive, personaContextActive, focusGroupContextActive])

  const handleStartFocusGroupClick = useCallback(() => {
    if (!onStartFocusGroup) return
    if (!canStartFocusGroup) return
    void Promise.resolve(
      onStartFocusGroup(
        focusParticipants.map((p) => p.id),
        focusCountryContext,
        focusTopic.trim()
      )
    ).then(() => {
      setFocusParticipantIds([])
      setFocusTopic("")
    })
  }, [
    canStartFocusGroup,
    focusCountryContext,
    focusParticipants,
    focusTopic,
    onStartFocusGroup,
  ])

  useEffect(() => {
    if (!projectId) return
    if (activePersonaTab !== "audience") return
    let cancelled = false
    setSavedAudiencesLoading(true)
    setSavedAudiencesError(null)
    fetch(`/api/audience/saved?project_id=${encodeURIComponent(projectId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? "Failed to load saved audiences.")
        }
        return res.json() as Promise<{ audiences?: SavedCustomAudience[] }>
      })
      .then((body) => {
        if (!cancelled) {
          const list = body.audiences ?? []
          setSavedAudiences(list)
          onSavedAudiencesHydrated?.(list)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSavedAudiencesError(
            error instanceof Error ? error.message : "Failed to load saved audiences."
          )
        }
      })
      .finally(() => {
        if (!cancelled) setSavedAudiencesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activePersonaTab, projectId, onSavedAudiencesHydrated])

  useEffect(() => {
    if (appliedCustomAudience) {
      setAudienceView("list")
    }
  }, [appliedCustomAudience?.id])

  function openAudienceDetail(audience?: SavedCustomAudience | null) {
    const nextDraft = snapshotToDraft(audience?.snapshot ?? null)
    if (nextDraft) {
      setAudienceSegmentIds(nextDraft.segmentIds)
      setCountry(nextDraft.country)
      setGender(nextDraft.gender)
      setAgeRange(nextDraft.ageRange)
      setConcernRange(nextDraft.concernRange)
    } else {
      setAudienceSegmentIds(segmentPersonas.map((persona) => persona.id))
      setCountry("all")
      setGender("all")
      setAgeRange([18, 75])
      setConcernRange([1, 10])
    }
    setEditingAudienceId(audience?.id ?? null)
    setAudienceNameDraft(audience?.name ?? "")
    setAudienceView("detail")
  }

  async function saveAudienceDraft(): Promise<SavedCustomAudience | null> {
    if (!projectId || audienceSaving) return null
    const isUpdate = Boolean(editingAudienceId)
    const trimmedName = audienceNameDraft.trim()
    if (isUpdate && !trimmedName) return null

    const builderDraft: AudienceBuilderDraft = {
      segmentIds: audienceSegmentIds,
      country,
      gender,
      ageRange,
      concernRange,
    }
    const existingLower = new Set(
      savedAudiences
        .filter((row) => !isUpdate || row.id !== editingAudienceId)
        .map((row) => row.name.trim().toLowerCase())
        .filter(Boolean)
    )
    const nameForPost =
      trimmedName ||
      buildAutoGeneratedCustomAudienceName(
        builderDraft,
        customAudienceN,
        customAudienceAvgConcern,
        existingLower,
        segmentPersonas
      )

    setAudienceSaving(true)
    const payload = {
      name: nameForPost,
      filters_summary: null,
      base_size: customAudienceN,
      avg_concern: Number(customAudienceAvgConcern),
      snapshot: draftToSnapshot(builderDraft, segmentPersonas),
    }
    const endpoint = isUpdate
      ? `/api/audience/saved/${editingAudienceId}`
      : "/api/audience/saved"
    const method = isUpdate ? "PATCH" : "POST"
    const body = isUpdate
      ? payload
      : {
          ...payload,
          project_id: projectId,
        }
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(errorBody?.error ?? "Failed to save audience.")
      }
      const saved = (await res.json()) as SavedCustomAudience
      setSavedAudiences((prev) => {
        const rest = prev.filter((row) => row.id !== saved.id)
        return [saved, ...rest]
      })
      onSavedAudienceUpsert?.(saved)
      setEditingAudienceId(saved.id)
      setAudienceNameDraft(saved.name)
      if (!isUpdate && appliedCustomAudience && isDraftCustomAudienceId(appliedCustomAudience.id)) {
        onPromoteDraftExploreThread?.(saved)
      }
      return saved
    } catch (error) {
      setSavedAudiencesError(
        error instanceof Error ? error.message : "Failed to save audience."
      )
      return null
    } finally {
      setAudienceSaving(false)
    }
  }

  async function saveAppliedDraftCustomAudience(
    displayName: string
  ): Promise<SavedCustomAudience | null> {
    if (!projectId || audienceSaving) return null
    const aud = appliedCustomAudience
    if (!aud || !isDraftCustomAudienceId(aud.id)) return null
    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setSavedAudiencesError("Please enter an audience name.")
      return null
    }
    if (atSavedAudienceCap) {
      setSavedAudiencesError(
        `You can save up to ${MAX_SAVED_CUSTOM_AUDIENCES_PER_USER} custom audiences for this project. Delete one to create another.`
      )
      return null
    }
    const draft = snapshotToDraft(aud.snapshot)
    if (!draft) return null
    const n =
      aud.baseSize != null && aud.baseSize > 0
        ? aud.baseSize
        : estimateCustomAudienceNFromDraft(draft, segmentPersonas)
    const avgStr =
      aud.avgConcern != null && Number.isFinite(aud.avgConcern)
        ? aud.avgConcern.toFixed(1)
        : weightedAvgConcernFromDraft(draft, segmentPersonas)

    setAudienceSaving(true)
    setSavedAudiencesError(null)
    try {
      const res = await fetch("/api/audience/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          name: trimmedName,
          filters_summary: null,
          base_size: n,
          avg_concern: Number.parseFloat(avgStr),
          snapshot: draftToSnapshot(draft, segmentPersonas),
        }),
      })
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(errorBody?.error ?? "Failed to save audience.")
      }
      const saved = (await res.json()) as SavedCustomAudience
      setSavedAudiences((prev) => {
        const rest = prev.filter((row) => row.id !== saved.id)
        return [saved, ...rest]
      })
      onSavedAudienceUpsert?.(saved)
      onReplaceAppliedCustomAudience?.(saved)
      return saved
    } catch (error) {
      setSavedAudiencesError(
        error instanceof Error ? error.message : "Failed to save audience."
      )
      return null
    } finally {
      setAudienceSaving(false)
    }
  }

  async function deleteSavedAudienceRow(audience: SavedCustomAudience) {
    if (
      !window.confirm(
        `Delete "${audience.name}"? You cannot undo this.`
      )
    ) {
      return
    }
    setDeletingAudienceId(audience.id)
    setSavedAudiencesError(null)
    try {
      const res = await fetch(
        `/api/audience/saved/${encodeURIComponent(audience.id)}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(errorBody?.error ?? "Failed to delete audience.")
      }
      setSavedAudiences((prev) => prev.filter((row) => row.id !== audience.id))
      onSavedAudienceDeleted?.(audience.id)
      if (appliedCustomAudience?.id === audience.id) {
        onClearCustomAudience?.()
      }
    } catch (error) {
      setSavedAudiencesError(
        error instanceof Error ? error.message : "Failed to delete audience."
      )
    } finally {
      setDeletingAudienceId(null)
    }
  }

  async function handleSaveAudience() {
    const saved = await saveAudienceDraft()
    if (!saved) return
    setAudienceView("list")
  }

  function applyCurrentAudienceDraft() {
    const existing = editingAudienceId
      ? savedAudiences.find((audience) => audience.id === editingAudienceId) ?? null
      : null
    if (existing) {
      onApplyCustomAudience(existing)
      return
    }
    const builderDraft: AudienceBuilderDraft = {
      segmentIds: audienceSegmentIds,
      country,
      gender,
      ageRange,
      concernRange,
    }
    const snapshot = draftToSnapshot(builderDraft, segmentPersonas)
    const previewName =
      audienceNameDraft.trim() ||
      buildAutoGeneratedCustomAudienceName(
        builderDraft,
        customAudienceN,
        customAudienceAvgConcern,
        undefined,
        segmentPersonas
      ) ||
      "Unsaved Audience"
    onApplyCustomAudience({
      id: `draft-${Date.now()}`,
      projectId,
      organizationId: "",
      createdBy: null,
      exploreNameWasTyped: Boolean(audienceNameDraft.trim()),
      name: previewName,
      description: null,
      filtersSummary: null,
      baseSize: customAudienceN,
      avgConcern: Number(customAudienceAvgConcern),
      snapshot,
      childSegmentColorTokens: snapshot.childSegments.map((segment) => {
        const t = segment.colorToken?.trim()
        if (
          t &&
          (isCiteColorToken(t) || t === SEGMENT_BRAND_DEFAULT_COLOR_TOKEN)
        ) {
          return t
        }
        return SEGMENT_BRAND_DEFAULT_COLOR_TOKEN
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  function handleCancelAudienceDetail() {
    setAudienceView("list")
  }

  return (
    <SegmentPersonasContext.Provider value={segmentPersonas}>
    <aside
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col bg-white",
        onClose ? "h-full" : "h-fit max-h-full min-h-0",
        className
      )}
      aria-label="Persona"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-0 pt-3 pb-2">
        <div className="min-w-0 flex-1">
          <p className="font-arse-title text-xs font-bold uppercase tracking-wide text-arse-black">
            Personas
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
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border py-1 pl-2.5 pr-1 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black",
              appliedPersonaChatTone?.cardBorder,
              appliedPersonaChatTone?.cardBg
            )}
          >
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                !isCiteColorDotFillToken(appliedPersona.colorCiteToken) && appliedPersona.dotClassName
              )}
              style={citeColorDotFillStyle(appliedPersona.colorCiteToken)}
            />
            <span>{appliedPersona.title}</span>
            {onClearPersona ? (
              <button
                type="button"
                onClick={onClearPersona}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink",
                  "hover:bg-arse-black/[0.08]"
                )}
                aria-label="End live segment"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>
      ) : appliedCustomAudience ? (
        <AppliedCustomAudienceChip
          audience={appliedCustomAudience}
          onClear={onClearCustomAudience}
        />
      ) : appliedFocusGroup ? (
        <AppliedFocusGroupChip
          session={appliedFocusGroup}
          onEnd={onEndFocusGroup}
          running={focusGroupRunning}
        />
      ) : null}

      <Tabs
        value={activePersonaTab}
        onValueChange={handlePersonaTabChange}
        className="flex min-h-0 flex-1 flex-col overflow-hidden py-2"
      >
        <TabsList className={personaSubTabListClass}>
          <TabsTrigger
            value="segments"
            className={cn(
              personaSubTabTriggerClass,
              (customAudienceContextActive || focusGroupContextActive) &&
                "cursor-not-allowed text-arse-black/35 data-[state=active]:border-transparent"
            )}
            disabled={customAudienceContextActive || focusGroupContextActive}
            aria-disabled={customAudienceContextActive || focusGroupContextActive}
          >
            Segments
          </TabsTrigger>
          <TabsTrigger
            value="audience"
            className={cn(
              personaSubTabTriggerClass,
              (personaLocked || focusGroupContextActive) &&
                "cursor-not-allowed text-arse-black/35 data-[state=active]:border-transparent"
            )}
            disabled={personaLocked || focusGroupContextActive}
            aria-disabled={personaLocked || focusGroupContextActive}
          >
            Custom Audience
          </TabsTrigger>
          <TabsTrigger
            value="focus"
            className={cn(
              personaSubTabTriggerClass,
              personaContextActive || customAudienceContextActive
                ? "cursor-not-allowed text-arse-black/35 data-[state=active]:border-transparent"
                : null
            )}
            disabled={personaContextActive || customAudienceContextActive}
            aria-disabled={personaContextActive || customAudienceContextActive}
          >
            Focus Group
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="segments"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-0 data-[state=inactive]:hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-2">
          {appliedPersona ? (
            <>
              <PersonaDetailCard persona={appliedPersona} />
              <div>
                <p className="mb-2 font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/45">
                  Suggested questions
                </p>
                <div className="flex flex-col gap-2">
                  {appliedPersona.suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onSuggestedQuestionSelect?.(q)}
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
              <p className="font-arse-body text-xs leading-relaxed text-arse-black/70">
                Explore a segment's collective perspective from the 2025 Study. Select a segment to begin.
              </p>
              <div className="flex flex-col gap-3">
                {segmentPersonas.map((p) => (
                  <SegmentListCard
                    key={p.id}
                    persona={p}
                    selected={false}
                    onSelect={() => onApply(p.id)}
                    disabled={customAudienceContextActive}
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2">
            {appliedCustomAudience ? (
              <>
                {isArchivedCustomAudienceId(appliedCustomAudience.id) ? (
                  <Alert
                    className={cn(
                      "flex flex-row items-start gap-2 rounded-xl border border-amber-200/90 bg-amber-50 py-2.5 pl-3 pr-3 shadow-none",
                      "[&>svg]:static [&>svg]:left-auto [&>svg]:top-auto [&>svg]:translate-y-0 [&>svg~*]:pl-0"
                    )}
                    role="status"
                  >
                    <Info
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-800/75"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <AlertDescription className="font-arse-body text-[11px] leading-snug text-arse-black/75">
                      This audience is no longer in your saved list; context is preserved for this chat
                      only.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {savedAudiencesError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-arse-body text-xs text-red-700">
                    {savedAudiencesError}
                  </p>
                ) : null}
                <CustomAudienceLiveCard
                  audience={appliedCustomAudience}
                  draftActions={
                    isDraftCustomAudienceId(appliedCustomAudience.id)
                      ? {
                          onSaveWithName: (name) =>
                            saveAppliedDraftCustomAudience(name),
                          onEndSession: () => onClearCustomAudience?.(),
                          saving: audienceSaving,
                          saveDisabled: atSavedAudienceCap,
                        }
                      : undefined
                  }
                />
                {!isArchivedCustomAudienceId(appliedCustomAudience.id) ? (
                  <div>
                    <p className="mb-2 font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/45">
                      Suggested questions
                    </p>
                    <div className="flex flex-col gap-2">
                      {customAudienceSuggestedQuestions(appliedCustomAudience, segmentPersonas).map((question, index) => (
                        <button
                          key={`${index}-${question}`}
                          type="button"
                          onClick={() => onSuggestedQuestionSelect?.(question)}
                          className="rounded-xl border-2 border-arse-black/15 bg-arse-black/[0.02] px-3 py-2 text-left font-arse-body text-xs text-arse-black/80 transition hover:border-arse-pink/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : !showAudienceDetail ? (
              <>
                <div
                  className={cn(
                    "flex flex-col gap-4",
                    audienceListEmpty &&
                      "rounded-2xl border border-dashed border-arse-black/12 bg-arse-black/[0.02] px-4 py-6 sm:py-7"
                  )}
                >
                  {audienceListEmpty ? (
                    <div className="flex flex-col gap-2">
                      <h2 className="font-arse-title text-sm font-bold leading-snug text-arse-black">
                        Chat with a custom audience
                      </h2>
                      <p className="font-arse-body text-xs leading-relaxed text-arse-black/70">
                        Combine segments, countries, genders, ages, and concern filters to create a
                        tailored audience. Then chat to learn more about their views about the
                        research.
                      </p>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openAudienceDetail(null)}
                    disabled={audienceUiDisabled || atSavedAudienceCap}
                    aria-disabled={audienceUiDisabled || atSavedAudienceCap}
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-arse-black bg-white px-4 py-2.5 text-center font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black shadow-[3px_3px_0_0_var(--arse-pink)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink",
                      audienceUiDisabled || atSavedAudienceCap
                        ? "cursor-not-allowed opacity-50 shadow-none"
                        : "hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--arse-pink)]"
                    )}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    New Audience
                  </button>
                </div>
                {atSavedAudienceCap ? (
                  <p className="font-arse-body text-xs leading-relaxed text-arse-black/60">
                    You can save up to {MAX_SAVED_CUSTOM_AUDIENCES_PER_USER} custom audiences for this
                    project. Delete one to create another.
                  </p>
                ) : null}
                {savedAudiencesError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-arse-body text-xs text-red-700">
                    {savedAudiencesError}
                  </p>
                ) : null}
                <div className="space-y-2">
                  {savedAudiences.map((audience) => (
                    <div
                      key={audience.id}
                      className="flex items-stretch gap-1 overflow-hidden rounded-xl border border-arse-black/10 bg-white transition hover:border-arse-black/25"
                    >
                      <span
                        title="Apply"
                        className={cn(
                          "min-w-0 flex-1",
                          audienceUiDisabled && "cursor-not-allowed"
                        )}
                      >
                        <button
                          type="button"
                          aria-label={`Apply custom audience ${audience.name} to chat`}
                          disabled={audienceUiDisabled}
                          aria-disabled={audienceUiDisabled}
                          onClick={() => onApplyCustomAudience(audience)}
                          className={cn(
                            "h-full w-full px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-inset",
                            audienceUiDisabled && "cursor-not-allowed opacity-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-arse-title text-sm font-bold text-arse-black">
                              {audience.name}
                            </p>
                            <span className="inline-flex shrink-0 -space-x-1.5">
                              {savedCustomAudienceStackDisplayTokens(
                                audience,
                                segmentPersonas
                              )
                                .slice(0, 4)
                                .map((token, index) => (
                                  <span
                                    key={`${token}-${index}`}
                                    className={cn(
                                      "h-2.5 w-2.5 rounded-full border border-white",
                                      !isCiteColorDotFillToken(token) &&
                                        customAudienceDotClass(token)
                                    )}
                                    style={citeColorDotFillStyle(token)}
                                  />
                                ))}
                            </span>
                          </div>
                          <p className="mt-1 font-arse-body text-xs text-arse-black/60">
                            n={audience.baseSize ?? 0} · Avg concern{" "}
                            {audience.avgConcern?.toFixed?.(1) ?? "0.0"}/10
                          </p>
                        </button>
                      </span>
                      <div className="flex shrink-0 items-stretch border-l border-arse-black/10">
                        <span
                          title="Edit"
                          className={cn(
                            "inline-flex h-full",
                            audienceUiDisabled && "cursor-not-allowed"
                          )}
                        >
                          <button
                            type="button"
                            aria-label={`Edit saved audience ${audience.name}`}
                            disabled={audienceUiDisabled}
                            onClick={() => openAudienceDetail(audience)}
                            className="flex h-full min-h-[2.75rem] items-center justify-center px-3 text-arse-black/50 transition hover:bg-arse-black/[0.04] hover:text-arse-black disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </button>
                        </span>
                        <span
                          title="Delete"
                          className={cn(
                            "inline-flex h-full",
                            (audienceUiDisabled || deletingAudienceId === audience.id) &&
                              "cursor-not-allowed"
                          )}
                        >
                          <button
                            type="button"
                            aria-label={`Delete saved audience ${audience.name}`}
                            disabled={audienceUiDisabled || deletingAudienceId === audience.id}
                            onClick={() => void deleteSavedAudienceRow(audience)}
                            className="flex h-full min-h-[2.75rem] items-center justify-center border-l border-arse-black/10 px-3 text-arse-black/50 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </button>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {savedAudiencesLoading ? (
                  <div
                    className={cn(
                      "flex w-full flex-col items-center text-center",
                      !hasSavedAudiences ? "min-h-[7rem] justify-center py-2" : "justify-center py-3"
                    )}
                  >
                    <p className="font-arse-body text-xs text-arse-black/60">
                      Loading saved audiences...
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleCancelAudienceDetail}
                    disabled={audienceUiDisabled}
                    aria-disabled={audienceUiDisabled}
                    className={cn(
                      "inline-flex items-center gap-0.5 self-start font-arse-title text-xs font-bold text-arse-black/70 transition hover:text-arse-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
                      audienceUiDisabled && "cursor-not-allowed opacity-40 hover:text-arse-black/70"
                    )}
                    aria-label="Back to audiences"
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                    Back
                  </button>
                  <h2 className="font-arse-title text-sm font-bold leading-snug text-arse-black">
                    {editingAudienceId ? "Edit your custom audience" : "Add a custom audience"}
                  </h2>
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                      Audience name
                    </p>
                    <input
                      value={audienceNameDraft}
                      onChange={(event) => setAudienceNameDraft(event.target.value)}
                      disabled={audienceUiDisabled}
                      placeholder="e.g. UK women, high concern"
                      className="mt-2 w-full rounded-lg border border-arse-black/10 bg-muted px-3 py-2 font-arse-body text-sm text-arse-black placeholder:text-arse-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                      Segments (
                      {audienceSegmentIds.length === 1
                        ? "1 selected"
                        : `${audienceSegmentIds.length} selected`}
                      )
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {segmentPersonas.map((persona) => {
                        const selected = audienceSegmentIds.includes(persona.id)
                        return (
                          <button
                            key={persona.id}
                            type="button"
                            disabled={audienceUiDisabled}
                            onClick={() =>
                              setAudienceSegmentIds((prev) =>
                                selected ? prev.filter((id) => id !== persona.id) : [...prev, persona.id]
                              )
                            }
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2.5 text-left",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink",
                              selected
                                ? "border-arse-black bg-arse-black/[0.03] text-arse-black shadow-sm"
                                : "border-arse-black/10 bg-arse-black/[0.02] text-arse-black/60",
                              audienceUiDisabled && "cursor-not-allowed opacity-50"
                            )}
                          >
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 shrink-0 rounded-full",
                                  !isCiteColorDotFillToken(persona.colorCiteToken) && persona.dotClassName
                                )}
                                style={citeColorDotFillStyle(persona.colorCiteToken)}
                              />
                              <span className="truncate font-arse-title text-xs font-bold">{persona.title}</span>
                            </span>
                            {selected ? (
                              <Check className="h-4 w-4 shrink-0 text-arse-black" strokeWidth={2.5} aria-hidden />
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                      Country
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          { id: "all" as const, label: "All" },
                          { id: "uk" as const, label: "UK" },
                          { id: "ksa" as const, label: "KSA" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={audienceUiDisabled}
                          onClick={() => setCountry(option.id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 font-arse-title text-xs font-bold",
                            country === option.id
                              ? "border-arse-black bg-arse-black text-white"
                              : "border-arse-black/15 bg-white text-arse-black/70",
                            audienceUiDisabled && "cursor-not-allowed opacity-50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                      Gender
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          { id: "all" as const, label: "All" },
                          { id: "male" as const, label: "Male" },
                          { id: "female" as const, label: "Female" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={audienceUiDisabled}
                          onClick={() => setGender(option.id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 font-arse-title text-xs font-bold",
                            gender === option.id
                              ? "border-arse-black bg-arse-black text-white"
                              : "border-arse-black/15 bg-white text-arse-black/70",
                            audienceUiDisabled && "cursor-not-allowed opacity-50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2 font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                      <span>Age</span>
                      <span className="rounded-lg bg-arse-black/[0.06] px-2 py-0.5 font-arse-body text-sm font-medium tabular-nums tracking-normal text-arse-black/70">
                        {ageRange[0]} – {ageRange[1]}
                      </span>
                    </div>
                    <Slider
                      min={18}
                      max={75}
                      step={1}
                      value={[ageRange[0], ageRange[1]]}
                      onValueChange={(next) => {
                        const lo = next[0] ?? 18
                        const hi = next[1] ?? 75
                        setAgeRange([Math.min(lo, hi), Math.max(lo, hi)])
                      }}
                      disabled={audienceUiDisabled}
                      trackClassName="h-1.5 rounded-full bg-arse-black/12"
                      rangeClassName="bg-arse-black"
                      thumbClassName="size-5 border-2 border-arse-black bg-white focus-visible:ring-arse-pink"
                      className="py-2"
                      aria-label="Age range"
                    />
                    <div className="mt-1 flex justify-between font-arse-body text-[10px] leading-none text-arse-black/45">
                      <span>18</span>
                      <span>75</span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2 font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                      <span>Concern level</span>
                      <span className="rounded-lg bg-arse-black/[0.06] px-2 py-0.5 font-arse-body text-sm font-medium tabular-nums tracking-normal text-arse-black/70">
                        {concernRange[0]} – {concernRange[1]}
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[concernRange[0], concernRange[1]]}
                      onValueChange={(next) => {
                        const lo = next[0] ?? 1
                        const hi = next[1] ?? 10
                        setConcernRange([Math.min(lo, hi), Math.max(lo, hi)])
                      }}
                      disabled={audienceUiDisabled}
                      trackClassName="h-1.5 rounded-full bg-arse-black/12"
                      rangeClassName="bg-arse-black"
                      thumbClassName="size-5 border-2 border-arse-black bg-white focus-visible:ring-arse-pink"
                      className="py-2"
                      aria-label="Concern level range"
                    />
                    <div className="mt-1 flex justify-between font-arse-body text-[10px] leading-none text-arse-black/45">
                      <span>1 (Low)</span>
                      <span>10 (High)</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-arse-black/10 bg-arse-black/[0.04] px-4 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="inline-flex items-center gap-1.5 font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                          <Users className="h-4 w-4 shrink-0 text-arse-black/55" strokeWidth={2} aria-hidden />
                          Audience size
                        </div>
                        <p className="font-arse-title text-sm font-bold leading-snug text-arse-black">
                          n={customAudienceN}{" "}
                          <span className="font-arse-body text-sm font-medium text-arse-black/50">
                            (
                            {selectedAudienceSegments.length > 0
                              ? `${((customAudienceN / selectedAudienceSegments.reduce((sum, p) => sum + p.surveyN, 0)) * 100).toFixed(0)}%`
                              : "0%"}
                            )
                          </span>
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="inline-flex items-center gap-1.5 font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                          <Gauge className="h-4 w-4 shrink-0 text-arse-black/55" strokeWidth={2} aria-hidden />
                          Avg concern
                        </div>
                        <p className="font-arse-title text-sm font-bold leading-snug text-arse-black">
                          {customAudienceAvgConcern}/10
                        </p>
                      </div>
                    </div>
                    {customAudienceN < 50 ? (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="font-arse-body text-sm">
                          Too few respondents (n={customAudienceN}). Need at least 50 to explore.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-arse-black/10 pt-4">
                  <div className="flex flex-col gap-2">
                    {!editingAudienceId ? (
                      <button
                        type="button"
                        disabled={audienceUiDisabled || customAudienceN < 50 || audienceSaving}
                        onClick={applyCurrentAudienceDraft}
                        className={cn(
                          "inline-flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border-2 border-arse-black bg-white px-4 py-2.5 font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black",
                          "shadow-[4px_4px_0_0_var(--arse-pink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_var(--arse-pink)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--arse-pink)]"
                        )}
                      >
                        <Compass className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                        Explore Audience
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleSaveAudience()}
                      disabled={
                        audienceUiDisabled ||
                        customAudienceN < 50 ||
                        audienceSaving ||
                        (Boolean(editingAudienceId) && !audienceNameDraft.trim())
                      }
                      className={cn(
                        "inline-flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-xl bg-arse-black px-4 py-2.5 font-arse-title text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-arse-black/90",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink focus-visible:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-40"
                      )}
                    >
                      <Bookmark className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.5} aria-hidden />
                      {audienceSaving ? "Saving..." : "Save Audience"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAudienceDetail}
                      disabled={audienceUiDisabled}
                      className={cn(
                        "self-center font-arse-title text-[10px] font-bold uppercase tracking-wide text-arse-black/55 underline decoration-arse-black/25 underline-offset-2 transition hover:text-arse-black",
                        audienceUiDisabled && "cursor-not-allowed opacity-40 hover:text-arse-black/55"
                      )}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="focus"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-0 data-[state=inactive]:hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2">
            {focusGroupContextActive && appliedFocusGroup ? (
              <FocusGroupActivePanel
                session={appliedFocusGroup}
                running={focusGroupRunning}
              />
            ) : (
              <>
            <p className="font-arse-body text-xs leading-relaxed text-arse-black/70">
              Select 2-4 segments to debate a topic. Each responds in turn, building on what others
              said.
            </p>

            <div>
              <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                Participants ({focusParticipants.length}/4)
              </p>
              <div className="mt-2 space-y-2">
                {segmentPersonas.map((persona) => {
                  const checked = focusParticipantIds.includes(persona.id)
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() =>
                        setFocusParticipantIds((prev) => {
                          if (checked) return prev.filter((id) => id !== persona.id)
                          if (prev.length >= 4) return prev
                          return [...prev, persona.id]
                        })
                      }
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left",
                        checked ? "border-arse-black/25 bg-white" : "border-arse-black/10 bg-white"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          checked
                            ? "border-arse-black bg-arse-black text-white"
                            : "border-arse-black/20 bg-white text-transparent"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-arse-title text-sm font-bold leading-tight text-arse-black">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              !isCiteColorDotFillToken(persona.colorCiteToken) && persona.dotClassName
                            )}
                            style={citeColorDotFillStyle(persona.colorCiteToken)}
                          />
                          {persona.title}
                        </p>
                        <p className="mt-1 font-arse-body text-sm text-arse-black/55">
                          n={persona.surveyN} · Concern: {persona.concernScore.toFixed(2)}/10 ·{" "}
                          {persona.qualitativeInterviews} qualitative interviews
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                Country context
              </p>
              <div className="mt-2 flex gap-2">
                {[
                  { id: "uk", label: "UK" },
                  { id: "ksa", label: "KSA" },
                  { id: "both", label: "Both" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setFocusCountryContext(option.id as "uk" | "ksa" | "both")
                    }
                    className={cn(
                      "rounded-full border px-4 py-1.5 font-arse-title text-sm font-bold",
                      focusCountryContext === option.id
                        ? "border-arse-black bg-arse-black text-white"
                        : "border-arse-black/15 bg-white text-arse-black/70"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-arse-title text-[10px] font-bold uppercase tracking-[0.2em] text-arse-black/55">
                Discussion topic
              </p>
              <textarea
                value={focusTopic}
                onChange={(event) => setFocusTopic(event.target.value.slice(0, 300))}
                placeholder="e.g. Should plastic bags be banned? How do you feel about carbon taxes?"
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-arse-black/10 bg-arse-black/[0.03] px-3 py-2.5 font-arse-body text-sm text-arse-black placeholder:text-arse-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arse-pink"
              />
              <p className="mt-1 text-right font-arse-body text-xs text-arse-black/45">
                {focusTopic.length}/300
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={!canStartFocusGroup || !onStartFocusGroup}
                onClick={handleStartFocusGroupClick}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 font-arse-title text-base font-bold",
                  canStartFocusGroup && onStartFocusGroup
                    ? "border-arse-black bg-arse-black text-white transition hover:bg-arse-black/90"
                    : "cursor-not-allowed border-arse-black/10 bg-arse-black/35 text-white/85"
                )}
              >
                Start Focus Group ({focusParticipants.length} participants)
              </button>
            </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
    </SegmentPersonasContext.Provider>
  )
}

export function PersonaDrawer({
  open,
  onClose,
  appliedPersona,
  appliedCustomAudience,
  appliedFocusGroup = null,
  projectId,
  onApply,
  onApplyCustomAudience,
  onClearPersona,
  onClearCustomAudience,
  onReplaceAppliedCustomAudience,
  onPromoteDraftExploreThread,
  onStartFocusGroup,
  onEndFocusGroup,
  focusGroupRunning = false,
  onSuggestedQuestionSelect,
  personaLocked = false,
  disabled = false,
  segmentPersonas = MOCK_SEGMENT_PERSONAS,
}: {
  open: boolean
  onClose?: () => void
  appliedPersona: PersonaMock | null
  appliedCustomAudience: SavedCustomAudience | null
  appliedFocusGroup?: FocusGroupSession | null
  projectId: string
  onApply: (personaId: string) => void
  onApplyCustomAudience: (audience: SavedCustomAudience) => void
  onClearPersona?: () => void
  onClearCustomAudience?: () => void
  onReplaceAppliedCustomAudience?: (audience: SavedCustomAudience) => void
  onPromoteDraftExploreThread?: (audience: SavedCustomAudience) => void
  onStartFocusGroup?: (
    personaIds: readonly string[],
    country: FocusGroupCountryContext,
    topic: string
  ) => Promise<void> | void
  onEndFocusGroup?: () => Promise<void> | void
  focusGroupRunning?: boolean
  onSuggestedQuestionSelect?: (question: string) => void
  personaLocked?: boolean
  disabled?: boolean
  segmentPersonas?: PersonaMock[]
}) {
  if (!open) return null
  return (
    <PersonaPanel
      appliedPersona={appliedPersona}
      appliedCustomAudience={appliedCustomAudience}
      appliedFocusGroup={appliedFocusGroup}
      projectId={projectId}
      onApply={onApply}
      onApplyCustomAudience={onApplyCustomAudience}
      onClearPersona={onClearPersona}
      onClearCustomAudience={onClearCustomAudience}
      onReplaceAppliedCustomAudience={onReplaceAppliedCustomAudience}
      onPromoteDraftExploreThread={onPromoteDraftExploreThread}
      onStartFocusGroup={onStartFocusGroup}
      onEndFocusGroup={onEndFocusGroup}
      focusGroupRunning={focusGroupRunning}
      onSuggestedQuestionSelect={onSuggestedQuestionSelect}
      personaLocked={personaLocked}
      disabled={disabled}
      onClose={onClose}
      segmentPersonas={segmentPersonas}
    />
  )
}
