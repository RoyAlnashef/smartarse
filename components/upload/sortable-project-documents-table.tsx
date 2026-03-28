"use client"

import { useMemo, type ReactNode } from "react"
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
  Trash2,
} from "lucide-react"
import type { UploadedFile } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
}

const statusColors: Record<string, string> = {
  uploading: "bg-muted text-muted-foreground",
  ready: "bg-mint-100 text-mint-700",
  processing: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isPersistedProjectDocumentRow(f: UploadedFile): boolean {
  return !f.id.startsWith("pending-") && f.status !== "uploading"
}

function DocumentsTableSkeleton() {
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
        Uploaded files will appear here.
      </p>
    </div>
  )
}

function EmptyState() {
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
        No documents match your filters.
      </p>
    </div>
  )
}

function StaticDocumentRow({
  file,
  onDelete,
  showDragColumn = false,
}: {
  file: UploadedFile
  onDelete?: (id: string) => void
  /** When true, reserve a narrow column for alignment with sortable rows (handle or spacer). */
  showDragColumn?: boolean
}) {
  const Icon = fileIcons[file.type] ?? File
  const showActions = Boolean(onDelete) && file.status !== "uploading"

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
            <div className="truncate font-medium text-foreground">{file.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatSize(file.size)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {file.status === "uploading" ? (
          <div className="max-w-[10rem] space-y-1.5">
            <Progress
              value={file.uploadProgress ?? 0}
              className="h-2 bg-muted [&>div]:bg-arse-cyan"
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
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={() => onDelete?.(file.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
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
}: {
  file: UploadedFile
  onDelete?: (id: string) => void
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
  const showActions = Boolean(onDelete) && file.status !== "uploading"

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
            <div className="truncate font-medium text-foreground">{file.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatSize(file.size)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {file.status === "uploading" ? (
          <div className="max-w-[10rem] space-y-1.5">
            <Progress
              value={file.uploadProgress ?? 0}
              className="h-2 bg-muted [&>div]:bg-arse-cyan"
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
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={() => onDelete?.(file.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
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
  isInitialLoading = false,
  reorderUnlocked,
  draftStableIds,
  onDraftStableIdsChange,
}: {
  files: UploadedFile[]
  onDelete?: (id: string) => void
  isInitialLoading?: boolean
  reorderUnlocked: boolean
  draftStableIds: string[]
  onDraftStableIdsChange: (ids: string[]) => void
}) {
  const byId = useMemo(() => new Map(files.map((f) => [f.id, f])), [files])

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
    return <DocumentsTableSkeleton />
  }
  if (files.length === 0) {
    return <EmptyState />
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

  if (showDragColumn) {
    return (
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
                  <SortableDocumentRow key={id} file={file} onDelete={onDelete} />
                )
              })}
            </SortableContext>
          </>,
          true
        )}
      </DndContext>
    )
  }

  return tableShell(
    <>
      {pendingRows.map((file) => (
        <StaticDocumentRow key={file.id} file={file} onDelete={onDelete} />
      ))}
      {stableInFileOrder.map((file) => (
        <StaticDocumentRow key={file.id} file={file} onDelete={onDelete} />
      ))}
    </>,
    false
  )
}
