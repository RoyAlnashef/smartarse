"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Palette,
  Pencil,
  Trash2,
} from "lucide-react"
import type { UploadedFile } from "@/lib/types"
import { adminDocumentPrimaryLabel } from "@/lib/documents/display-label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  AdvancedColorPicker,
  hsvaToRgba,
  type HsvaColor,
} from "@/components/ui/advanced-color-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  CITE_COLOR_TOKENS,
  citeColorBackgroundStyle,
  citePickerBaseHex,
  isCiteColorToken,
  nearestCiteColorTokenFromRgb,
  type CiteColorToken,
} from "@/lib/theme/cite-color-tokens"
import {
  CANONICAL_SEGMENT_IDS,
  CANONICAL_SEGMENT_OPTION_LABEL,
  isCanonicalSegmentId,
} from "@/lib/personas/canonical-segments"
import { personaSegmentColorTokenForId } from "@/lib/theme/persona-segment-theme"
import { isPersistedProjectDocumentRow } from "@/components/upload/sortable-project-documents-table"

const statusColors: Record<string, string> = {
  uploading: "bg-muted text-muted-foreground",
  ready: "bg-mint-100 text-mint-700",
  processing: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
}

function rgbToHsva(r: number, g: number, b: number): HsvaColor {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta > 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2)
    else h = 60 * ((rn - gn) / delta + 4)
  }
  if (h < 0) h += 360
  return { h, s: max === 0 ? 0 : delta / max, v: max }
}

/** Preview token for the Color column: explicit DB token, else canonical slot default (matches client resolver). */
function personaAdminColorPreviewToken(
  file: Pick<UploadedFile, "segmentColorToken" | "canonicalSegmentId">
): string | null {
  const row = file.segmentColorToken?.trim()
  if (row && isCiteColorToken(row)) return row
  const sid = file.canonicalSegmentId?.trim()
  if (sid && isCanonicalSegmentId(sid)) {
    return personaSegmentColorTokenForId(sid, null)
  }
  return null
}

function hsvaFromSegmentToken(token: string | null | undefined): HsvaColor {
  const hex = citePickerBaseHex(token)
  const normalized = hex.replace("#", "")
  const value = Number.parseInt(normalized, 16)
  return rgbToHsva((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
}

function PersonaSegmentSwatch({
  file,
}: {
  file: Pick<UploadedFile, "segmentColorToken" | "canonicalSegmentId">
}) {
  const preview = personaAdminColorPreviewToken(file)
  const explicit = file.segmentColorToken?.trim()
  const title = explicit
    ? `Segment color: ${explicit}`
    : preview
      ? `Slot default color (${preview}); pick “Segment color” to override`
      : "No segment slot — brand pink is the picker default until you assign a slot or set a color"
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-full border border-black/10 shadow-sm ring-1 ring-black/5"
      style={citeColorBackgroundStyle(preview)}
      title={title}
      aria-hidden
    />
  )
}

function PersonasTableSkeleton({ footerHint }: { footerHint: string }) {
  const rows = [0, 1, 2]
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
              Color
            </th>
            <th className="min-w-[8rem] px-2 py-3 font-medium text-muted-foreground">Segment</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((i) => (
            <tr key={i} className="hover:bg-transparent">
              <td className="w-14 px-2 py-3 align-middle">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                </div>
              </td>
              <td className="px-2 py-3">
                <Skeleton className="h-8 w-full max-w-[10rem] rounded-md" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-[70%]" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-16 rounded-full" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-7 w-7 rounded-md" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border bg-muted/20 px-4 py-2.5 text-center text-xs text-muted-foreground">
        {footerHint}
      </p>
    </div>
  )
}

type PersonaRowHandlers = {
  file: UploadedFile
  onDelete?: (id: string) => void
  onRequestEditDisplayName?: (file: UploadedFile) => void
  onRequestEditSegmentColor?: (file: UploadedFile) => void
  onRequestEditSegmentDescription?: (file: UploadedFile) => void
  onSaveCanonicalSegment?: (
    personaId: string,
    canonicalSegmentId: string | null
  ) => void | Promise<void>
}

function PersonaRowCells({
  file,
  onDelete,
  onRequestEditDisplayName,
  onRequestEditSegmentColor,
  onRequestEditSegmentDescription,
  onSaveCanonicalSegment,
}: PersonaRowHandlers) {
  const showActions =
    (Boolean(onDelete) ||
      Boolean(onRequestEditDisplayName) ||
      Boolean(onRequestEditSegmentColor) ||
      Boolean(onRequestEditSegmentDescription) ||
      Boolean(onSaveCanonicalSegment)) &&
    file.status !== "uploading"
  const primary = adminDocumentPrimaryLabel(file)
  const hasCustomDisplay = Boolean(file.displayName?.trim())
  const segmentValue = file.canonicalSegmentId?.trim() ?? ""

  return (
    <>
      <td className="w-14 px-2 py-3 align-middle">
        <div className="flex justify-center">
          <PersonaSegmentSwatch file={file} />
        </div>
      </td>
      <td className="min-w-[9rem] px-2 py-3 align-middle">
        {onSaveCanonicalSegment && isPersistedProjectDocumentRow(file) ? (
          <select
            className="w-full max-w-[14rem] rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            value={segmentValue}
            onChange={(e) => {
              const v = e.target.value
              onSaveCanonicalSegment(file.id, v === "" ? null : v)
            }}
            aria-label="Study segment this persona represents"
          >
            <option value="">Not assigned</option>
            {CANONICAL_SEGMENT_IDS.map((sid) => (
              <option key={sid} value={sid}>
                {CANONICAL_SEGMENT_OPTION_LABEL[sid]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="min-w-0 px-4 py-3 align-top">
        <div className="truncate font-medium text-foreground">{primary}</div>
        {hasCustomDisplay ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            <span className="block truncate" title={file.name}>
              {file.name}
            </span>
          </div>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top">
        {file.status === "uploading" ? (
          <div className="max-w-[10rem] space-y-1.5">
            <Progress
              value={file.uploadProgress ?? 0}
              className="h-2 bg-muted [&>div]:bg-arse-pink"
            />
            <span className="text-xs text-muted-foreground">Uploading…</span>
          </div>
        ) : (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[file.status] ?? statusColors.processing}`}
          >
            {file.status}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right align-top">
        {showActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open actions for {file.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRequestEditDisplayName && isPersistedProjectDocumentRow(file) ? (
                <DropdownMenuItem onClick={() => onRequestEditDisplayName(file)}>
                  <Pencil className="h-4 w-4" />
                  Edit segment display name
                </DropdownMenuItem>
              ) : null}
              {onRequestEditSegmentDescription && isPersistedProjectDocumentRow(file) ? (
                <DropdownMenuItem onClick={() => onRequestEditSegmentDescription(file)}>
                  <Pencil className="h-4 w-4" />
                  Edit segment description
                </DropdownMenuItem>
              ) : null}
              {onRequestEditSegmentColor && isPersistedProjectDocumentRow(file) ? (
                <DropdownMenuItem onClick={() => onRequestEditSegmentColor(file)}>
                  <Palette className="h-4 w-4" />
                  Segment color
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={() => onDelete(file.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </td>
    </>
  )
}

function StaticPersonaRow({
  file,
  showDragSpacer,
  ...handlers
}: PersonaRowHandlers & { showDragSpacer: boolean }) {
  return (
    <tr className="transition-colors hover:bg-muted/30">
      {showDragSpacer ? (
        <td className="w-10 px-2 py-3 align-middle" aria-hidden>
          <span className="block w-7" />
        </td>
      ) : null}
      <PersonaRowCells file={file} {...handlers} />
    </tr>
  )
}

function SortablePersonaRow({ file, ...handlers }: PersonaRowHandlers) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors hover:bg-muted/30 ${isDragging ? "z-10 bg-muted/50 opacity-90" : ""}`}
    >
      <td className="w-10 px-2 py-3 align-middle">
        <button
          type="button"
          className="cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder ${file.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 shrink-0" />
        </button>
      </td>
      <PersonaRowCells file={file} {...handlers} />
    </tr>
  )
}

const defaultLabels = {
  emptyMessage: "No personas uploaded for this project yet.",
  footerHint: "Markdown personas will appear here.",
} as const

export type SortableProjectPersonasTableLabels = {
  emptyMessage?: string
  footerHint?: string
}

export function SortableProjectPersonasTable({
  files,
  onDelete,
  onSaveDisplayName,
  onSaveSegmentColor,
  onSaveSegmentDescription,
  onSaveCanonicalSegment,
  isInitialLoading = false,
  reorderUnlocked,
  draftStableIds,
  onDraftStableIdsChange,
  labels: labelsProp,
  unavailableColorTokens = [],
}: {
  files: UploadedFile[]
  onDelete?: (id: string) => void
  onSaveDisplayName?: (personaId: string, displayName: string | null) => Promise<void>
  onSaveSegmentColor?: (personaId: string, segmentColorToken: string | null) => Promise<void>
  onSaveSegmentDescription?: (
    personaId: string,
    segmentDescription: string | null
  ) => Promise<void>
  onSaveCanonicalSegment?: (
    personaId: string,
    canonicalSegmentId: string | null
  ) => Promise<void>
  isInitialLoading?: boolean
  reorderUnlocked: boolean
  draftStableIds: string[]
  onDraftStableIdsChange: (ids: string[]) => void
  labels?: SortableProjectPersonasTableLabels
  unavailableColorTokens?: string[]
}) {
  const labels = { ...defaultLabels, ...labelsProp }
  const byId = useMemo(() => new Map(files.map((f) => [f.id, f])), [files])

  const [displayNameTarget, setDisplayNameTarget] = useState<UploadedFile | null>(null)
  const [displayNameDraft, setDisplayNameDraft] = useState("")
  const [savingDisplayName, setSavingDisplayName] = useState(false)

  const [segmentColorTarget, setSegmentColorTarget] = useState<UploadedFile | null>(null)
  const [savingSegmentColor, setSavingSegmentColor] = useState(false)
  const [draftHsva, setDraftHsva] = useState<HsvaColor>({ h: 330, s: 0.7, v: 0.9 })
  const [showUnavailableColors, setShowUnavailableColors] = useState(false)

  const [descriptionTarget, setDescriptionTarget] = useState<UploadedFile | null>(null)
  const [descriptionDraft, setDescriptionDraft] = useState("")
  const [savingDescription, setSavingDescription] = useState(false)

  const openDisplayNameDialog = (file: UploadedFile) => {
    setDisplayNameTarget(file)
    setDisplayNameDraft(file.displayName?.trim() ? file.displayName : "")
  }

  const handleSaveDisplayName = async () => {
    if (!displayNameTarget || !onSaveDisplayName) return
    setSavingDisplayName(true)
    try {
      const next = displayNameDraft.trim() === "" ? null : displayNameDraft.trim()
      await onSaveDisplayName(displayNameTarget.id, next)
      setDisplayNameTarget(null)
    } finally {
      setSavingDisplayName(false)
    }
  }

  const openSegmentColorDialog = (file: UploadedFile) => {
    setSegmentColorTarget(file)
    setShowUnavailableColors(false)
    setDraftHsva(hsvaFromSegmentToken(personaAdminColorPreviewToken(file)))
  }

  const handlePickSegmentColor = async (token: CiteColorToken | null) => {
    if (!segmentColorTarget || !onSaveSegmentColor) return
    setSavingSegmentColor(true)
    try {
      await onSaveSegmentColor(segmentColorTarget.id, token)
      setSegmentColorTarget(null)
    } finally {
      setSavingSegmentColor(false)
    }
  }

  const draftNearestToken = useMemo(() => {
    const rgb = hsvaToRgba(draftHsva)
    return nearestCiteColorTokenFromRgb(rgb)
  }, [draftHsva])

  const unavailableTokenSet = useMemo(() => {
    const set = new Set<CiteColorToken>()
    const currentTargetId = segmentColorTarget?.id ?? null
    const currentTargetToken = segmentColorTarget?.segmentColorToken?.trim() ?? null
    for (const file of files) {
      if (file.id === currentTargetId) continue
      const token = file.segmentColorToken?.trim()
      if (token && isCiteColorToken(token)) set.add(token)
    }
    for (const token of unavailableColorTokens) {
      const trimmed = token.trim()
      if (trimmed && isCiteColorToken(trimmed)) set.add(trimmed)
    }
    if (currentTargetToken && isCiteColorToken(currentTargetToken)) {
      set.delete(currentTargetToken)
    }
    return set
  }, [segmentColorTarget?.segmentColorToken, segmentColorTarget?.id, files, unavailableColorTokens])

  const draftTokenUnavailable = unavailableTokenSet.has(draftNearestToken)

  const unavailableTokensInOrder = useMemo(
    () => CITE_COLOR_TOKENS.filter((token) => unavailableTokenSet.has(token)),
    [unavailableTokenSet]
  )

  const openDescriptionDialog = (file: UploadedFile) => {
    setDescriptionTarget(file)
    setDescriptionDraft(file.segmentDescription?.trim() ? file.segmentDescription : "")
  }

  const handleSaveDescription = async () => {
    if (!descriptionTarget || !onSaveSegmentDescription) return
    setSavingDescription(true)
    try {
      const next = descriptionDraft.trim() === "" ? null : descriptionDraft.trim()
      await onSaveSegmentDescription(descriptionTarget.id, next)
      setDescriptionTarget(null)
    } finally {
      setSavingDescription(false)
    }
  }

  const { pendingRows, stableInFileOrder } = useMemo(() => {
    const pending: UploadedFile[] = []
    const stable: UploadedFile[] = []
    for (const f of files) {
      if (isPersistedProjectDocumentRow(f)) stable.push(f)
      else pending.push(f)
    }
    return { pendingRows: pending, stableInFileOrder: stable }
  }, [files])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = draftStableIds.indexOf(active.id as string)
    const newIndex = draftStableIds.indexOf(over.id as string)
    if (oldIndex < 0 || newIndex < 0) return
    onDraftStableIdsChange(arrayMove(draftStableIds, oldIndex, newIndex))
  }

  if (isInitialLoading) {
    return <PersonasTableSkeleton footerHint={labels.footerHint} />
  }
  if (files.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {labels.emptyMessage}
        </p>
      </div>
    )
  }

  const showDragColumn = reorderUnlocked && draftStableIds.length > 0

  const tableHead = (withHandle: boolean) => (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        {withHandle ? <th className="w-10 px-2 py-3" aria-hidden /> : null}
        <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
          Color
        </th>
        <th className="min-w-[9rem] px-2 py-3 text-left text-xs font-medium text-muted-foreground">
          Segment slot
        </th>
        <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
        <th className="px-4 py-3 font-medium text-muted-foreground">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  )

  const tableShell = (body: ReactNode, withHandle: boolean) => (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        {tableHead(withHandle)}
        <tbody className="divide-y divide-border">{body}</tbody>
      </table>
      <p className="border-t border-border bg-muted/20 px-4 py-2.5 text-center text-xs text-muted-foreground">
        {labels.footerHint}
      </p>
    </div>
  )

  const displayNameDialog = (
    <Dialog
      open={displayNameTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDisplayNameTarget(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit segment display name</DialogTitle>
          <DialogDescription>
            Shown on the client Segments list for the assigned study slot. Leave empty to use the
            mock segment title.
          </DialogDescription>
        </DialogHeader>
        {displayNameTarget ? (
          <div className="grid gap-2 py-1">
            <Label htmlFor="persona-display-name">Display name</Label>
            <Input
              id="persona-display-name"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              placeholder="e.g. The Do Nothing-ers"
              maxLength={500}
              disabled={savingDisplayName}
            />
            <p className="text-xs text-muted-foreground">
              File: <span className="font-medium">{displayNameTarget.name}</span>
            </p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDisplayNameTarget(null)}
            disabled={savingDisplayName}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSaveDisplayName()}
            disabled={savingDisplayName || !onSaveDisplayName}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const segmentColorDialog = (
    <Dialog
      open={segmentColorTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setShowUnavailableColors(false)
          setSegmentColorTarget(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Segment color</DialogTitle>
          <DialogDescription>
            Used for dots and accents when this persona represents a study segment. Tokens already
            used for Data Sources or other personas cannot be selected again.
          </DialogDescription>
        </DialogHeader>
        {segmentColorTarget ? (
          <div className="grid gap-3 py-1">
            <p className="text-xs text-muted-foreground">
              File: <span className="font-medium text-foreground">{segmentColorTarget.name}</span>
            </p>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Color picker</p>
              <AdvancedColorPicker value={draftHsva} onChange={setDraftHsva} />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Nearest token</span>
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={citeColorBackgroundStyle(draftNearestToken)}
                    aria-hidden
                  />
                  {draftNearestToken}
                </span>
              </div>
              {draftTokenUnavailable ? (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  This token is already used by a document source or another persona. Pick another
                  color.
                </p>
              ) : null}
              {unavailableTokensInOrder.length > 0 ? (
                <Collapsible
                  open={showUnavailableColors}
                  onOpenChange={setShowUnavailableColors}
                  className="mt-3 rounded-md border border-border/60 bg-background/70"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <span>
                        Unavailable colors ({unavailableTokensInOrder.length})
                      </span>
                      {showUnavailableColors ? (
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 pb-2">
                    <p className="mb-2 text-[10px] leading-snug text-muted-foreground">
                      Reserved for document source colors or other segment rows.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unavailableTokensInOrder.map((token) => (
                        <span
                          key={token}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/10"
                            style={citeColorBackgroundStyle(token)}
                            aria-hidden
                          />
                          {token}
                        </span>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={savingSegmentColor || draftTokenUnavailable}
              onClick={() => void handlePickSegmentColor(draftNearestToken)}
            >
              Apply Color
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={savingSegmentColor}
              onClick={() => void handlePickSegmentColor(null)}
            >
              Use Default
            </Button>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSegmentColorTarget(null)}
            disabled={savingSegmentColor}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const descriptionDialog = (
    <Dialog
      open={descriptionTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDescriptionTarget(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit segment description</DialogTitle>
          <DialogDescription>
            Shown on the client segment card. Leave empty to use the default mock description.
          </DialogDescription>
        </DialogHeader>
        {descriptionTarget ? (
          <div className="grid gap-2 py-1">
            <Label htmlFor="persona-segment-desc">Description</Label>
            <Textarea
              id="persona-segment-desc"
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Short paragraph for the segment list…"
              maxLength={2000}
              rows={5}
              disabled={savingDescription}
            />
            <p className="text-xs text-muted-foreground">
              File: <span className="font-medium">{descriptionTarget.name}</span>
            </p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDescriptionTarget(null)}
            disabled={savingDescription}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSaveDescription()}
            disabled={savingDescription || !onSaveSegmentDescription}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (showDragColumn) {
    return (
      <>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {tableShell(
            <>
              {pendingRows.map((file) => (
                <StaticPersonaRow
                  key={file.id}
                  showDragSpacer
                  file={file}
                  onDelete={onDelete}
                  onRequestEditDisplayName={onSaveDisplayName ? openDisplayNameDialog : undefined}
                  onRequestEditSegmentColor={onSaveSegmentColor ? openSegmentColorDialog : undefined}
                  onRequestEditSegmentDescription={
                    onSaveSegmentDescription ? openDescriptionDialog : undefined
                  }
                  onSaveCanonicalSegment={onSaveCanonicalSegment}
                />
              ))}
              <SortableContext items={draftStableIds} strategy={verticalListSortingStrategy}>
                {draftStableIds.map((rowId) => {
                  const file = byId.get(rowId)
                  if (!file) return null
                  return (
                    <SortablePersonaRow
                      key={rowId}
                      file={file}
                      onDelete={onDelete}
                      onRequestEditDisplayName={onSaveDisplayName ? openDisplayNameDialog : undefined}
                      onRequestEditSegmentColor={onSaveSegmentColor ? openSegmentColorDialog : undefined}
                      onRequestEditSegmentDescription={
                        onSaveSegmentDescription ? openDescriptionDialog : undefined
                      }
                      onSaveCanonicalSegment={onSaveCanonicalSegment}
                    />
                  )
                })}
              </SortableContext>
            </>,
            true
          )}
        </DndContext>
        {displayNameDialog}
        {segmentColorDialog}
        {descriptionDialog}
      </>
    )
  }

  return (
    <>
      {tableShell(
        <>
          {pendingRows.map((file) => (
            <StaticPersonaRow
              key={file.id}
              showDragSpacer={false}
              file={file}
              onDelete={onDelete}
              onRequestEditDisplayName={onSaveDisplayName ? openDisplayNameDialog : undefined}
              onRequestEditSegmentColor={onSaveSegmentColor ? openSegmentColorDialog : undefined}
              onRequestEditSegmentDescription={
                onSaveSegmentDescription ? openDescriptionDialog : undefined
              }
              onSaveCanonicalSegment={onSaveCanonicalSegment}
            />
          ))}
          {stableInFileOrder.map((file) => (
            <StaticPersonaRow
              key={file.id}
              showDragSpacer={false}
              file={file}
              onDelete={onDelete}
              onRequestEditDisplayName={onSaveDisplayName ? openDisplayNameDialog : undefined}
              onRequestEditSegmentColor={onSaveSegmentColor ? openSegmentColorDialog : undefined}
              onRequestEditSegmentDescription={
                onSaveSegmentDescription ? openDescriptionDialog : undefined
              }
              onSaveCanonicalSegment={onSaveCanonicalSegment}
            />
          ))}
        </>,
        false
      )}
      {displayNameDialog}
      {segmentColorDialog}
      {descriptionDialog}
    </>
  )
}
