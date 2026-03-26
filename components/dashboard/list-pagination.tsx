"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaginationEllipsis } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { LIST_PAGE_SIZE } from "@/lib/constants"

function buildPageItems(
  totalPages: number,
  currentPage: number
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const set = new Set<number>()
  set.add(1)
  set.add(totalPages)
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= totalPages) set.add(p)
  }
  const sorted = [...set].sort((a, b) => a - b)
  const out: Array<number | "ellipsis"> = []
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]
    if (i > 0 && sorted[i - 1] !== undefined && n - sorted[i - 1]! > 1) {
      out.push("ellipsis")
    }
    out.push(n)
  }
  return out
}

export function ListPagination({
  currentPage,
  totalItems,
  pageSize = LIST_PAGE_SIZE,
  onPageChange,
  className,
}: {
  currentPage: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
  className?: string
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const start =
    totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems)
  const pageItems = buildPageItems(totalPages, safePage)
  const navLocked = totalPages <= 1

  return (
    <div
      className={cn(
        "flex flex-nowrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 sm:gap-3",
        className
      )}
    >
      <p className="min-w-0 shrink text-sm text-muted-foreground">
        {totalItems === 0 ? (
          <>
            <span className="font-medium text-foreground">0</span> items
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Showing </span>
            <span className="font-medium text-foreground">
              {start}–{end}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalItems}</span>
          </>
        )}
      </p>
      <nav
        aria-label="Pagination"
        className="flex shrink-0 flex-nowrap items-center gap-1"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-0 px-2 sm:gap-1 sm:pl-2.5 sm:pr-3"
          disabled={navLocked || safePage <= 1}
          aria-label="Go to previous page"
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        <ul className="flex flex-row items-center gap-1">
          {pageItems.map((item, idx) =>
            item === "ellipsis" ? (
              <li key={`e-${idx}`}>
                <PaginationEllipsis />
              </li>
            ) : (
              <li key={item}>
                <Button
                  type="button"
                  variant={item === safePage ? "outline" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                  disabled={navLocked}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === safePage ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              </li>
            )
          )}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-0 px-2 sm:gap-1 sm:pl-3 sm:pr-2.5"
          disabled={navLocked || safePage >= totalPages}
          aria-label="Go to next page"
          onClick={() => onPageChange(safePage + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </nav>
    </div>
  )
}
