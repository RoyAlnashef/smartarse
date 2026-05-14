"use client"

import { CardSectionHeaderWithInfoTooltip } from "@/components/client/project-detail/card-section-header-with-info-tooltip"
import type { UploadedFile } from "@/lib/types"
import { sourceListLabel } from "@/lib/documents/display-label"
import { citeSourceIndexBadgeCn, citeSourceIndexBadgeStyle } from "@/lib/theme/cite-color-tokens"
import { lucideIconForProjectDocument } from "@/lib/theme/source-file-icons"

const DATA_SOURCES_INFO_TEXT =
  "This is the seed data smartA.R.S.E. has ingested and from which all answers will be derived."

export function SourcesSelector({
  files,
}: {
  files: UploadedFile[]
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-dark-950 text-arse-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
      <CardSectionHeaderWithInfoTooltip
        title="Data Sources"
        tooltipText={DATA_SOURCES_INFO_TEXT}
      />
      <div className="px-4 py-4">
        <div className="space-y-0">
          {files.length === 0 ? (
            <p className="text-sm text-arse-white/70">No sources for this project yet.</p>
          ) : (
            <>
              {files.map((file, index) => {
                const Icon = lucideIconForProjectDocument(file)
                const n = index + 1
                return (
                  <div
                    key={file.id}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left sm:gap-3"
                  >
                    <span
                      aria-hidden
                      className={citeSourceIndexBadgeCn(n, file.citeColorToken, "row")}
                      style={citeSourceIndexBadgeStyle(file.citeColorToken)}
                    >
                      {n}
                    </span>
                    <Icon
                      className="h-4 w-4 shrink-0 text-arse-white/75"
                      strokeWidth={1}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block whitespace-normal break-words font-arse-body text-xs font-semibold leading-snug">
                        {sourceListLabel(file)}
                      </span>
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

