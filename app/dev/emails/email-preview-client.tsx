"use client"

import { useMemo, useState } from "react"
import type { EmailPreviewEntry } from "@/lib/email/preview/samples"

type EmailPreviewClientProps = {
  previews: EmailPreviewEntry[]
  initialId: string
}

type CodeSource = "copy" | "preview"

function copyableHtml(entry: EmailPreviewEntry, source: CodeSource): string {
  if (source === "copy" && entry.supabaseHtml) return entry.supabaseHtml
  return entry.html
}

export function EmailPreviewClient({ previews, initialId }: EmailPreviewClientProps) {
  const [selectedId, setSelectedId] = useState(initialId)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [codeSource, setCodeSource] = useState<CodeSource>("copy")

  const selected = useMemo(
    () => previews.find((entry) => entry.id === selectedId) ?? previews[0],
    [previews, selectedId],
  )

  const activeCode = selected ? copyableHtml(selected, codeSource) : ""
  const hasSupabaseVariant = Boolean(selected?.supabaseHtml)

  function selectTemplate(id: string) {
    setSelectedId(id)
    const entry = previews.find((item) => item.id === id)
    setCodeSource(entry?.supabaseHtml ? "copy" : "preview")
  }

  async function copyActiveCode() {
    if (!activeCode) return
    await navigator.clipboard.writeText(activeCode)
    setCopyStatus("Copied")
    window.setTimeout(() => setCopyStatus(null), 2000)
  }

  const appPreviews = previews.filter((entry) => entry.category === "app")
  const supabasePreviews = previews.filter((entry) => entry.category === "supabase")

  return (
    <div className="flex h-screen bg-[#f9fafb] text-[#171717]">
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-[#e5e5e5] bg-white p-4">
        <h1 className="mb-1 text-lg font-bold">Email templates</h1>
        <p className="mb-6 text-xs text-[#545454]">Development preview only</p>

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#545454]">App (Resend)</h2>
          <ul className="space-y-1">
            {appPreviews.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => selectTemplate(entry.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    selected?.id === entry.id
                      ? "bg-[#e9faf9] font-semibold ring-1 ring-[#00d4c8]"
                      : "hover:bg-[#f4f4f5]"
                  }`}
                >
                  {entry.label}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#545454]">Supabase Auth</h2>
          <ul className="space-y-1">
            {supabasePreviews.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => selectTemplate(entry.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    selected?.id === entry.id
                      ? "bg-[#e9faf9] font-semibold ring-1 ring-[#00d4c8]"
                      : "hover:bg-[#f4f4f5]"
                  }`}
                >
                  {entry.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[#e5e5e5] bg-white px-6 py-4">
          <h2 className="truncate text-base font-bold">{selected?.label}</h2>
          <p className="truncate text-sm text-[#545454]">Subject: {selected?.subject}</p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-[#e5e5e5]">
          <section className="flex min-h-0 flex-col bg-[#e9faf9]">
            <div className="shrink-0 border-b border-[#e5e5e5] bg-white px-4 py-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#545454]">Preview</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {selected ? (
                <iframe
                  title={selected.label}
                  srcDoc={selected.html}
                  className="mx-auto block min-h-full w-full max-w-[560px] rounded-lg border border-[#d4d4d4] bg-white shadow-sm"
                  sandbox=""
                />
              ) : null}
            </div>
          </section>

          <section className="flex min-h-0 flex-col bg-[#1a1a1a]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#333] px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#a3a3a3]">
                  {hasSupabaseVariant && codeSource === "copy"
                    ? "Supabase HTML"
                    : "HTML"}
                </h3>
                {hasSupabaseVariant ? (
                  <div className="flex rounded-md border border-[#404040] text-[10px] font-bold uppercase tracking-wide">
                    <button
                      type="button"
                      onClick={() => setCodeSource("copy")}
                      className={`px-2 py-1 ${
                        codeSource === "copy"
                          ? "bg-[#ff4fb2] text-[#171717]"
                          : "text-[#a3a3a3] hover:text-white"
                      }`}
                    >
                      Supabase
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeSource("preview")}
                      className={`px-2 py-1 ${
                        codeSource === "preview"
                          ? "bg-[#00d4c8] text-[#171717]"
                          : "text-[#a3a3a3] hover:text-white"
                      }`}
                    >
                      Rendered
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {copyStatus ? (
                  <span className="text-xs text-[#00d4c8]">{copyStatus}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => void copyActiveCode()}
                  className="shrink-0 rounded-full border border-[#525252] bg-[#262626] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-[#333]"
                >
                  Copy
                </button>
              </div>
            </div>

            {selected && hasSupabaseVariant && codeSource === "copy" ? (
              <div className="shrink-0 border-b border-[#333] bg-[#262626] px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#737373]">Subject</p>
                <p className="font-mono text-xs text-[#e5e5e5]">{selected.subject}</p>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-auto">
              <pre className="p-4 font-mono text-xs leading-relaxed text-[#e5e5e5] whitespace-pre-wrap break-all">
                <code>{activeCode}</code>
              </pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
