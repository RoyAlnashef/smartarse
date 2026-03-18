"use client"

import { Check } from "lucide-react"
import type { UploadedFile } from "@/lib/types"
import { cn } from "@/lib/utils"

export function SourcesSelector({
  files,
  selected,
  onToggle,
}: {
  files: UploadedFile[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-arse-black/60 text-arse-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
      <div className="bg-arse-magenta px-4 py-2 text-center font-arse-title text-xs font-bold uppercase tracking-[0.35em] text-arse-white">
        Sources
      </div>
      <div className="px-4 py-4">
        <p className="mb-3 text-xs text-arse-white/70">Sources to include</p>
        <div className="space-y-2">
          {files.length === 0 ? (
            <p className="text-sm text-arse-white/70">No sources for this project yet.</p>
          ) : (
            files.map((file) => {
              const isSelected = selected.has(file.id)
              const disabled = file.status !== "ready"
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => onToggle(file.id)}
                  disabled={disabled}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition",
                    "focus:outline-none focus:ring-2 focus:ring-arse-cyan/40",
                    disabled ? "opacity-50" : "hover:bg-arse-white/5"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border-2 border-arse-white/70",
                      isSelected ? "bg-arse-cyan text-arse-black border-arse-cyan" : "bg-transparent"
                    )}
                  >
                    {isSelected ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-arse-title text-xs font-bold uppercase tracking-wide">
                      {file.name}
                    </span>
                    {disabled ? (
                      <span className="mt-0.5 block text-[11px] text-arse-white/60">
                        Not ready ({file.status})
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

