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
  FileText,
  FileSpreadsheet,
  File,
  GripVertical,
  MoreHorizontal,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  md: FileText,
}

const statusColors: Record<string, string> = {
  uploading: "bg-muted text-muted-foreground",
  ready: "bg-mint-100 text-mint-700",
  processing: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
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

function DocumentsTableSkeleton({ footerHint }: { footerHint: string }) {
  const rows = [0, 1, 2]
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
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
              <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-2 py-0.5">
                    <Skeleton
                      className={`h-4 max-w-[min(100%,14rem)] ${i === 0 ? "w-[85%]" : i === 1 ? "w-[72%]" : "w-[90%]"}`}
                    />
                    <Skeleton className="h-3 w-16" />
                  </div>
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

function EmptyState({ emptyMessage }: { emptyMessage: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
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
  onRequestEditDisplayName,
}: {
  file: UploadedFile
  onDelete?: (id: string) => void
  /** When true, reserve a narrow column for alignment with sortable rows (handle or spacer). */
  showDragColumn?: boolean
  onRequestEditDisplayName?: (file: UploadedFile) => void
}) {
  const Icon = fileIcons[file.type] ?? File
  const showActions =
    (Boolean(onDelete) || Boolean(onRequestEditDisplayName)) &&
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
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-foreground">{primary}</div>
            {hasCustomDisplay ? (
              <div className="mt-0.5 text-xs text-muted-foreground">
                <span className="block truncate" title={file.name}>
                  {file.name}
                </span>
              </div>
            ) : null}
          </div>
        </div>
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
  onRequestEditDisplayName,
}: {
  file: UploadedFile
  onDelete?: (id: string) => void
  onRequestEditDisplayName?: (file: UploadedFile) => void
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

  const Icon = fileIcons[file.type] ?? File
  const showActions =
    (Boolean(onDelete) || Boolean(onRequestEditDisplayName)) &&
    file.status !== "uploading"
  const primary = adminDocumentPrimaryLabel(file)
  const hasCustomDisplay = Boolean(file.displayName?.trim())

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors hover:bg-muted/30 ${isDragging ? "z-10 bg-muted/50 opacity-90" : ""}`}
    >
      <td className="w-10 px-2 py-3 align-top">
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
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-foreground">{primary}</div>
            {hasCustomDisplay ? (
              <div className="mt-0.5 text-xs text-muted-foreground">
                <span className="block truncate" title={file.name}>
                  {file.name}
                </span>
              </div>
            ) : null}
          </div>
        </div>
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
  isInitialLoading = false,
  reorderUnlocked,
  draftStableIds,
  onDraftStableIdsChange,
  labels: labelsProp,
}: {
  files: UploadedFile[]
  onDelete?: (id: string) => void
  /** When set, row menu includes “Edit display name” for persisted rows (e.g. project documents only). */
  onSaveDisplayName?: (
    documentId: string,
    displayName: string | null
  ) => Promise<void>
  isInitialLoading?: boolean
  reorderUnlocked: boolean
  draftStableIds: string[]
  onDraftStableIdsChange: (ids: string[]) => void
  /** Empty table copy and skeleton footer (e.g. personas vs documents). */
  labels?: SortableProjectDocumentsTableLabels
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
    return <DocumentsTableSkeleton footerHint={labels.footerHint} />
  }
  if (files.length === 0) {
    return <EmptyState emptyMessage={labels.emptyMessage} />
  }

  const showDragColumn = reorderUnlocked && draftStableIds.length > 0

  const tableHead = (withHandleCol: boolean) => (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        {withHandleCol ? (
          <th className="w-10 px-2 py-3" aria-hidden />
        ) : null}
        <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
        <th className="px-4 py-3 font-medium text-muted-foreground">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  )

  const tableShell = (body: ReactNode, withHandleCol: boolean) => (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        {tableHead(withHandleCol)}
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
                  onRequestEditDisplayName={requestEditDisplayName}
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
                      onRequestEditDisplayName={requestEditDisplayName}
                    />
                  )
                })}
              </SortableContext>
            </>,
            true
          )}
        </DndContext>
        {displayNameDialog}
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
              onRequestEditDisplayName={requestEditDisplayName}
            />
          ))}
          {stableInFileOrder.map((file) => (
            <StaticDocumentRow
              key={file.id}
              file={file}
              onDelete={onDelete}
              onRequestEditDisplayName={requestEditDisplayName}
            />
          ))}
        </>,
        false
      )}
      {displayNameDialog}
    </>
  )
}
