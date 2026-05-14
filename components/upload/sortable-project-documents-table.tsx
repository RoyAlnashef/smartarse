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
  Shapes,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import {
  CITE_COLOR_TOKENS,
  citeColorBackgroundStyle,
  citePickerBaseHex,
  isCiteColorToken,
  nearestCiteColorTokenFromRgb,
  type CiteColorToken,
} from "@/lib/theme/cite-color-tokens"
import {
  SOURCE_FILE_ICON_KEYS,
  lucideIconForProjectDocument,
  lucideIconForSourceFileKey,
  type SourceFileIconKey,
} from "@/lib/theme/source-file-icons"
import { cn } from "@/lib/utils"

const SOURCE_ICON_LABELS: Record<SourceFileIconKey, string> = {
  pdf: "PDF",
  spreadsheet: "Spreadsheet",
  document: "Document",
  presentation: "Presentation",
  markdown: "Markdown",
}

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

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hsvaFromCiteToken(token: string | null | undefined): HsvaColor {
  const hex = citePickerBaseHex(token)
  const normalized = hex.replace("#", "")
  const value = Number.parseInt(normalized, 16)
  return rgbToHsva((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
}

export function isPersistedProjectDocumentRow(f: UploadedFile): boolean {
  return !f.id.startsWith("pending-") && f.status !== "uploading"
}

const defaultSortableProjectDocumentsTableLabels = {
  emptyMessage: "No documents match your filters.",
  footerHint: "Uploaded files will appear here.",
} as const

export type SortableProjectDocumentsTableLabels = {
  emptyMessage?: string
  footerHint?: string
}

/** Small indicator for `cite_color_token` in the documents table (default = brand pink). */
function DocumentCiteColorSwatch({ file }: { file: Pick<UploadedFile, "citeColorToken"> }) {
  const raw = file.citeColorToken?.trim()
  const token = raw && isCiteColorToken(raw) ? raw : null
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-full border border-black/10 shadow-sm ring-1 ring-black/5"
      style={citeColorBackgroundStyle(file.citeColorToken)}
      title={token ? `Source color: ${token}` : "Default source color"}
      aria-hidden
    />
  )
}

function DocumentsTableSkeleton({
  footerHint,
  showCiteColorColumn,
}: {
  footerHint: string
  showCiteColorColumn: boolean
}) {
  const rows = [0, 1, 2]
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {showCiteColorColumn ? (
              <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
                Color
              </th>
            ) : null}
            <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
              Icon
            </th>
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
              {showCiteColorColumn ? (
                <td className="w-14 px-2 py-3 align-middle">
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                  </div>
                </td>
              ) : null}
              <td className="w-14 px-2 py-3 align-middle">
                <div className="flex justify-center">
                  <Skeleton className="h-5 w-5 shrink-0 rounded-sm" />
                </div>
              </td>
              <td className="min-w-0 px-4 py-3">
                <div className="space-y-2 py-0.5">
                  <Skeleton
                    className={`h-4 max-w-[min(100%,14rem)] ${i === 0 ? "w-[85%]" : i === 1 ? "w-[72%]" : "w-[90%]"}`}
                  />
                  <Skeleton className="h-3 w-16" />
                </div>
              </td>
              <td className="px-4 py-3 align-middle">
                <Skeleton className="h-5 w-20 rounded-full" />
              </td>
              <td className="px-4 py-3 text-right align-middle">
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

function EmptyState({
  emptyMessage,
  showCiteColorColumn,
}: {
  emptyMessage: string
  showCiteColorColumn: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {showCiteColorColumn ? (
              <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
                Color
              </th>
            ) : null}
            <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
              Icon
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
      </table>
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    </div>
  )
}

function StaticDocumentRow({
  file,
  onDelete,
  showDragColumn = false,
  showCiteColorColumn,
  onRequestEditDisplayName,
  onRequestEditCiteColor,
  onRequestEditSourceIcon,
}: {
  file: UploadedFile
  onDelete?: (id: string) => void
  /** When true, reserve a narrow column for alignment with sortable rows (handle or spacer). */
  showDragColumn?: boolean
  /** Documents tab: dedicated Color column for `cite_color_token`. */
  showCiteColorColumn: boolean
  onRequestEditDisplayName?: (file: UploadedFile) => void
  onRequestEditCiteColor?: (file: UploadedFile) => void
  onRequestEditSourceIcon?: (file: UploadedFile) => void
}) {
  const Icon = lucideIconForProjectDocument(file)
  const showActions =
    (Boolean(onDelete) ||
      Boolean(onRequestEditDisplayName) ||
      Boolean(onRequestEditCiteColor) ||
      Boolean(onRequestEditSourceIcon)) &&
    file.status !== "uploading"
  const primary = adminDocumentPrimaryLabel(file)
  const hasCustomDisplay = Boolean(file.displayName?.trim())

  return (
    <tr className="transition-colors hover:bg-muted/30">
      {showDragColumn ? (
        <td className="w-10 px-2 py-3 align-top" aria-hidden>
          <span className="block w-7" />
        </td>
      ) : null}
      {showCiteColorColumn ? (
        <td className="w-14 px-2 py-3 align-middle">
          <div className="flex justify-center">
            <DocumentCiteColorSwatch file={file} />
          </div>
        </td>
      ) : null}
      <td className="w-14 px-2 py-3 align-middle text-muted-foreground">
        <div className="flex justify-center" title={`Type: ${file.type}`}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
        </div>
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
                  Edit display name
                </DropdownMenuItem>
              ) : null}
              {onRequestEditCiteColor && isPersistedProjectDocumentRow(file) ? (
                <DropdownMenuItem onClick={() => onRequestEditCiteColor(file)}>
                  <Palette className="h-4 w-4" />
                  Source color
                </DropdownMenuItem>
              ) : null}
              {onRequestEditSourceIcon && isPersistedProjectDocumentRow(file) ? (
                <DropdownMenuItem onClick={() => onRequestEditSourceIcon(file)}>
                  <Shapes className="h-4 w-4" />
                  Source icon
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
    </tr>
  )
}

function SortableDocumentRow({
  file,
  onDelete,
  showCiteColorColumn,
  onRequestEditDisplayName,
  onRequestEditCiteColor,
  onRequestEditSourceIcon,
}: {
  file: UploadedFile
  onDelete?: (id: string) => void
  showCiteColorColumn: boolean
  onRequestEditDisplayName?: (file: UploadedFile) => void
  onRequestEditCiteColor?: (file: UploadedFile) => void
  onRequestEditSourceIcon?: (file: UploadedFile) => void
}) {
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

  const Icon = lucideIconForProjectDocument(file)
  const showActions =
    (Boolean(onDelete) ||
      Boolean(onRequestEditDisplayName) ||
      Boolean(onRequestEditCiteColor) ||
      Boolean(onRequestEditSourceIcon)) &&
    file.status !== "uploading"
  const primary = adminDocumentPrimaryLabel(file)
  const hasCustomDisplay = Boolean(file.displayName?.trim())

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
      {showCiteColorColumn ? (
        <td className="w-14 px-2 py-3 align-middle">
          <div className="flex justify-center">
            <DocumentCiteColorSwatch file={file} />
          </div>
        </td>
      ) : null}
      <td className="w-14 px-2 py-3 align-middle text-muted-foreground">
        <div className="flex justify-center" title={`Type: ${file.type}`}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
        </div>
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
                  Edit display name
                </DropdownMenuItem>
              ) : null}
              {onRequestEditCiteColor && isPersistedProjectDocumentRow(file) ? (
                <DropdownMenuItem onClick={() => onRequestEditCiteColor(file)}>
                  <Palette className="h-4 w-4" />
                  Source color
                </DropdownMenuItem>
              ) : null}
              {onRequestEditSourceIcon && isPersistedProjectDocumentRow(file) ? (
                <DropdownMenuItem onClick={() => onRequestEditSourceIcon(file)}>
                  <Shapes className="h-4 w-4" />
                  Source icon
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
    </tr>
  )
}

export function SortableProjectDocumentsTable({
  files,
  onDelete,
  onSaveDisplayName,
  onSaveCiteColor,
  onSaveSourceIcon,
  isInitialLoading = false,
  reorderUnlocked,
  draftStableIds,
  onDraftStableIdsChange,
  labels: labelsProp,
  unavailableColorTokens = [],
}: {
  files: UploadedFile[]
  onDelete?: (id: string) => void
  /** When set, row menu includes “Edit display name” for persisted rows (e.g. project documents only). */
  onSaveDisplayName?: (
    documentId: string,
    displayName: string | null
  ) => Promise<void>
  /** When set, row menu includes “Source color” (project documents only). */
  onSaveCiteColor?: (
    documentId: string,
    citeColorToken: string | null
  ) => Promise<void>
  /** When set, row menu includes “Source icon” (project documents only). */
  onSaveSourceIcon?: (
    documentId: string,
    sourceIconKey: string | null
  ) => Promise<void>
  isInitialLoading?: boolean
  reorderUnlocked: boolean
  draftStableIds: string[]
  onDraftStableIdsChange: (ids: string[]) => void
  /** Empty table copy and skeleton footer (e.g. personas vs documents). */
  labels?: SortableProjectDocumentsTableLabels
  /** Reserved tokens from other domains (e.g. persona colors) to disallow for docs. */
  unavailableColorTokens?: string[]
}) {
  const labels = {
    ...defaultSortableProjectDocumentsTableLabels,
    ...labelsProp,
  }
  const byId = useMemo(() => new Map(files.map((f) => [f.id, f])), [files])

  const [displayNameTarget, setDisplayNameTarget] = useState<UploadedFile | null>(
    null
  )
  const [displayNameDraft, setDisplayNameDraft] = useState("")
  const [savingDisplayName, setSavingDisplayName] = useState(false)
  const [citeColorTarget, setCiteColorTarget] = useState<UploadedFile | null>(null)
  const [savingCiteColor, setSavingCiteColor] = useState(false)
  const [draftHsva, setDraftHsva] = useState<HsvaColor>({
    h: 330,
    s: 0.7,
    v: 0.9,
  })
  const [sourceIconTarget, setSourceIconTarget] = useState<UploadedFile | null>(null)
  const [savingSourceIcon, setSavingSourceIcon] = useState(false)
  const [showUnavailableColors, setShowUnavailableColors] = useState(false)

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

  const requestEditDisplayName = onSaveDisplayName ? openDisplayNameDialog : undefined

  const openCiteColorDialog = (file: UploadedFile) => {
    setCiteColorTarget(file)
    setDraftHsva(hsvaFromCiteToken(file.citeColorToken))
  }

  const requestEditCiteColor = onSaveCiteColor ? openCiteColorDialog : undefined

  const openSourceIconDialog = (file: UploadedFile) => {
    setSourceIconTarget(file)
  }

  const requestEditSourceIcon = onSaveSourceIcon ? openSourceIconDialog : undefined

  const handlePickSourceIcon = async (key: SourceFileIconKey | null) => {
    if (!sourceIconTarget || !onSaveSourceIcon) return
    setSavingSourceIcon(true)
    try {
      await onSaveSourceIcon(sourceIconTarget.id, key)
      setSourceIconTarget(null)
    } finally {
      setSavingSourceIcon(false)
    }
  }

  const handlePickCiteColor = async (token: CiteColorToken | null) => {
    if (!citeColorTarget || !onSaveCiteColor) return
    setSavingCiteColor(true)
    try {
      await onSaveCiteColor(citeColorTarget.id, token)
      setCiteColorTarget(null)
    } finally {
      setSavingCiteColor(false)
    }
  }

  const draftNearestToken = useMemo(() => {
    const rgb = hsvaToRgba(draftHsva)
    return nearestCiteColorTokenFromRgb(rgb)
  }, [draftHsva])

  const unavailableTokenSet = useMemo(() => {
    const set = new Set<CiteColorToken>()
    const currentTargetId = citeColorTarget?.id ?? null
    const currentTargetToken = citeColorTarget?.citeColorToken?.trim() ?? null
    for (const file of files) {
      if (file.id === currentTargetId) continue
      const token = file.citeColorToken?.trim()
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
  }, [citeColorTarget?.citeColorToken, citeColorTarget?.id, files, unavailableColorTokens])

  const unavailableTokensInOrder = useMemo(
    () => CITE_COLOR_TOKENS.filter((token) => unavailableTokenSet.has(token)),
    [unavailableTokenSet]
  )
  const draftTokenUnavailable = unavailableTokenSet.has(draftNearestToken)

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

  const showCiteColorColumn = Boolean(onSaveCiteColor)

  if (isInitialLoading) {
    return (
      <DocumentsTableSkeleton
        footerHint={labels.footerHint}
        showCiteColorColumn={showCiteColorColumn}
      />
    )
  }
  if (files.length === 0) {
    return (
      <EmptyState
        emptyMessage={labels.emptyMessage}
        showCiteColorColumn={showCiteColorColumn}
      />
    )
  }

  const showDragColumn = reorderUnlocked && draftStableIds.length > 0

  const tableHead = (withHandleCol: boolean, citeColor: boolean) => (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        {withHandleCol ? (
          <th className="w-10 px-2 py-3" aria-hidden />
        ) : null}
        {citeColor ? (
          <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
            Color
          </th>
        ) : null}
        <th className="w-14 px-2 py-3 text-center text-xs font-medium text-muted-foreground">
          Icon
        </th>
        <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
        <th className="px-4 py-3 font-medium text-muted-foreground">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  )

  const tableShell = (
    body: ReactNode,
    withHandleCol: boolean,
    citeColor: boolean
  ) => (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        {tableHead(withHandleCol, citeColor)}
        <tbody className="divide-y divide-border">{body}</tbody>
      </table>
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
          <DialogTitle>Edit display name</DialogTitle>
          <DialogDescription>
            Shown in Sources and citation tooltips. Leave empty to use the file name.
          </DialogDescription>
        </DialogHeader>
        {displayNameTarget ? (
          <div className="grid gap-2 py-1">
            <Label htmlFor="doc-display-name">Display name</Label>
            <Input
              id="doc-display-name"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              placeholder="e.g. Sustainability report 2023"
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

  const citeColorDialog = (
    <Dialog
      open={citeColorTarget !== null}
      onOpenChange={(open) => {
        if (!open) setCiteColorTarget(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Source color</DialogTitle>
          <DialogDescription>
            Color for this document&apos;s index in Data Sources and citations. Leave as default
            to match the standard accent.
          </DialogDescription>
        </DialogHeader>
        {citeColorTarget ? (
          <div className="grid gap-3 py-1">
            <p className="text-xs text-muted-foreground">
              File: <span className="font-medium text-foreground">{citeColorTarget.name}</span>
            </p>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Source color picker</p>
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
                  This token is already used. Pick another color.
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
              disabled={savingCiteColor || draftTokenUnavailable}
              onClick={() => void handlePickCiteColor(draftNearestToken)}
            >
              Apply Color
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={savingCiteColor}
              onClick={() => void handlePickCiteColor(null)}
            >
              Use Default
            </Button>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCiteColorTarget(null)}
            disabled={savingCiteColor}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const sourceIconDialog = (
    <Dialog
      open={sourceIconTarget !== null}
      onOpenChange={(open) => {
        if (!open) setSourceIconTarget(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Source icon</DialogTitle>
          <DialogDescription>
            Icon shown in Data Sources and citations for this document. Use default to match the
            file type.
          </DialogDescription>
        </DialogHeader>
        {sourceIconTarget ? (
          <div className="grid gap-3 py-1">
            <p className="text-xs text-muted-foreground">
              File: <span className="font-medium text-foreground">{sourceIconTarget.name}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOURCE_FILE_ICON_KEYS.map((key) => {
                const KeyIcon = lucideIconForSourceFileKey(key)
                const selected = sourceIconTarget.sourceIconKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={savingSourceIcon}
                    onClick={() => void handlePickSourceIcon(key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center text-xs font-medium transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-foreground bg-muted/50 ring-2 ring-foreground/20"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <KeyIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    {SOURCE_ICON_LABELS[key]}
                  </button>
                )
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={savingSourceIcon}
              onClick={() => void handlePickSourceIcon(null)}
            >
              Use default icon
            </Button>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSourceIconTarget(null)}
            disabled={savingSourceIcon}
          >
            Close
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
                <StaticDocumentRow
                  key={file.id}
                  file={file}
                  onDelete={onDelete}
                  showDragColumn
                  showCiteColorColumn={showCiteColorColumn}
                  onRequestEditDisplayName={requestEditDisplayName}
                  onRequestEditCiteColor={requestEditCiteColor}
                  onRequestEditSourceIcon={requestEditSourceIcon}
                />
              ))}
              <SortableContext
                items={draftStableIds}
                strategy={verticalListSortingStrategy}
              >
                {draftStableIds.map((id) => {
                  const file = byId.get(id)
                  if (!file) return null
                  return (
                    <SortableDocumentRow
                      key={id}
                      file={file}
                      onDelete={onDelete}
                      showCiteColorColumn={showCiteColorColumn}
                      onRequestEditDisplayName={requestEditDisplayName}
                      onRequestEditCiteColor={requestEditCiteColor}
                      onRequestEditSourceIcon={requestEditSourceIcon}
                    />
                  )
                })}
              </SortableContext>
            </>,
            true,
            showCiteColorColumn
          )}
        </DndContext>
        {displayNameDialog}
        {citeColorDialog}
        {sourceIconDialog}
      </>
    )
  }

  return (
    <>
      {tableShell(
        <>
          {pendingRows.map((file) => (
            <StaticDocumentRow
              key={file.id}
              file={file}
              onDelete={onDelete}
              showCiteColorColumn={showCiteColorColumn}
              onRequestEditDisplayName={requestEditDisplayName}
              onRequestEditCiteColor={requestEditCiteColor}
              onRequestEditSourceIcon={requestEditSourceIcon}
            />
          ))}
          {stableInFileOrder.map((file) => (
            <StaticDocumentRow
              key={file.id}
              file={file}
              onDelete={onDelete}
              showCiteColorColumn={showCiteColorColumn}
              onRequestEditDisplayName={requestEditDisplayName}
              onRequestEditCiteColor={requestEditCiteColor}
              onRequestEditSourceIcon={requestEditSourceIcon}
            />
          ))}
        </>,
        false,
        showCiteColorColumn
      )}
      {displayNameDialog}
      {citeColorDialog}
      {sourceIconDialog}
    </>
  )
}
