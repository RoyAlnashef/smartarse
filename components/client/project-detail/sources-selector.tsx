"use client"

import type { UploadedFile } from "@/lib/types"
import { sourceListLabel } from "@/lib/documents/display-label"

export function SourcesSelector({
  files,
}: {
  files: UploadedFile[]
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-dark-950 text-arse-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
      <div className="bg-arse-pink px-4 py-2 text-center font-arse-title text-xs font-bold tracking-wide text-arse-white">
        Sources
      </div>
      <div className="px-4 py-4">
        <div className="space-y-0">
          {files.length === 0 ? (
            <p className="text-sm text-arse-white/70">No sources for this project yet.</p>
          ) : (
            files.map((file) => {
              return (
                <div
                  key={file.id}
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left"
                >
                  <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-arse-cyan" />
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-normal break-words font-arse-body text-xs font-semibold leading-snug">
                      {sourceListLabel(file)}
                    </span>
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

