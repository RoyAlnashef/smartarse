"use client";

import { FileText, BarChart3, MessageSquareQuote, AlertTriangle } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Source, InterviewChunkData, SurveyChunkData } from "@/lib/types";
import { Q_CODE_QUESTIONS } from "@/lib/survey-codes";
import { findChunkByContext, findVerbatimByContext, extractLastQuote } from "@/lib/citation-utils";
import { getSegmentBadgeClasses } from "@/lib/segments";

/* ── Interview quotes drawer ─────────────────────────────────────────── */

/** Full-height dialog listing all interview quote sources — triggered from
 *  both the inline [4] superscript chip and the CitationBar pill (P189). */
function InterviewQuotesDialog({
  source,
  trigger,
}: {
  source: Source;
  trigger: React.ReactNode;
}) {
  const chunks: InterviewChunkData[] = source.interview_chunks_data ?? [];
  const count = source.quote_count ?? chunks.length;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquareQuote className="h-4 w-4 shrink-0 text-emerald-600" />
            Interview Quotes
            <span className="text-sm font-normal text-muted-foreground">
              ({count})
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Interview quotes drawer
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="divide-y divide-border px-5">
            {chunks.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No interview excerpts available.
              </p>
            )}
            {chunks.map((chunk, i) => (
              <div key={i} className="space-y-2 py-4">
                {/* Demographics row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {chunk.interview_segment && (
                    <span className={getSegmentBadgeClasses(chunk.interview_segment)}>
                      {chunk.interview_segment}
                    </span>
                  )}
                  {[
                    chunk.interview_country,
                    chunk.interview_gender,
                    chunk.interview_age,
                  ]
                    .filter(Boolean)
                    .map((tag, j) => (
                      <span
                        key={j}
                        className="text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                {/* Moderator question */}
                {chunk.moderator_question && chunk.moderator_question.length >= 20 && (
                  <p className="text-[11px] text-muted-foreground/70 leading-snug">
                    <span className="font-medium uppercase tracking-wide">Q:</span>{" "}
                    {chunk.moderator_question}
                  </p>
                )}
                {/* Quote excerpt */}
                {chunk.chunk_preview && (
                  <p className="text-sm leading-relaxed text-foreground/80 italic">
                    &ldquo;{chunk.chunk_preview}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ── Shared popover card content (document + survey) ─────────────────── */

/** Popover card for [1] document, [2] white paper, [3] survey sources.
 *  P246 Phase 1: `qCodesOverride` narrows the survey Q-code list to those
 *  relevant to the specific sentence that triggered this inline popover. */
function SourceCardContent({
  source,
  qCodesOverride,
}: {
  source: Source;
  qCodesOverride?: string[] | null;
}) {
  const isSurvey = source.type === "survey";
  /** P246: prefer the per-sentence Q-code subset when provided and non-empty;
   *  otherwise fall back to the full synthesis union on source.question_codes. */
  const effectiveQCodes: string[] | null | undefined =
    qCodesOverride && qCodesOverride.length > 0
      ? qCodesOverride
      : source.question_codes;

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        {isSurvey ? (
          <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm font-medium text-foreground">
          {isSurvey ? "Survey Data" : (source.document_title || source.filename)}
        </span>
      </div>

      {/* "Written report" descriptor for [1]/[2] — replaces topic/about-this-source */}
      {!isSurvey && (source.index === 1 || source.index === 2) && (
        <p className="text-xs text-muted-foreground">Written report</p>
      )}

      {/* Document-specific content — skipped for [1]/[2] per minimal-popover request */}
      {!isSurvey && source.index !== 1 && source.index !== 2 && (
        <>
          {source.doc_type && (
            <span className="self-start rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {source.doc_type}
            </span>
          )}
          {source.chunk_topic && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Topic:</span> {source.chunk_topic}
            </p>
          )}
          {(() => {
            const useSlides = Array.isArray(source.slide_numbers) && source.slide_numbers.length > 0;
            const nums: number[] = useSlides ? (source.slide_numbers as number[]) : (source.page_numbers ?? []);
            const label = (useSlides || source.doc_type === "Main Report") ? "Slide" : "Page";
            if (nums.length > 0) return (
              <p className="text-[11px] text-muted-foreground">
                {label}{nums.length > 1 ? "s" : ""} {nums.join(", ")}
              </p>
            );
            if (source.page) return (
              <p className="text-[11px] text-muted-foreground">
                Page {source.page}
              </p>
            );
            return null;
          })()}
          {source.chunk_preview ? (
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                &ldquo;{source.chunk_preview}&rdquo;
              </p>
            </div>
          ) : source.doc_summary ? (
            <div className="space-y-0.5 rounded-md bg-muted/50 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                About this source
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {source.doc_summary}
              </p>
            </div>
          ) : null}
        </>
      )}

      {/* Survey-specific content */}
      {isSurvey && (
        <>
          {/* P246: prefer the per-sentence Q-code subset when inline_citations narrowed it;
              otherwise fall back to the full synthesis union. Single-code case shows
              the full question text instead of just the code. */}
          {effectiveQCodes && effectiveQCodes.length > 1 ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60 mb-1">
                {qCodesOverride && qCodesOverride.length > 0
                  ? "Survey questions cited here"
                  : "Multiple survey questions cited here"}
              </p>
              <ul className="space-y-1">
                {effectiveQCodes.map((qCode) => (
                  <li key={qCode} className="text-xs leading-relaxed text-foreground">
                    <span className="font-semibold">{qCode}.</span>{" "}
                    {Q_CODE_QUESTIONS[qCode] || ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : effectiveQCodes && effectiveQCodes.length === 1 ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-xs leading-relaxed text-foreground">
                <span className="font-semibold">{effectiveQCodes[0]}.</span>{" "}
                {Q_CODE_QUESTIONS[effectiveQCodes[0]] || ""}
              </p>
            </div>
          ) : source.question_code ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-xs leading-relaxed text-foreground">
                <span className="font-semibold">{source.question_code}.</span>{" "}
                {source.question_text ||
                  Q_CODE_QUESTIONS[source.question_code] ||
                  ""}
              </p>
            </div>
          ) : null}
          <span className="self-start rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
            {source.sample_description || "All Respondents"}
            {", "}n=
            {source.base_size?.toLocaleString() ??
              source.sample_size?.toLocaleString() ??
              "1,008"}
          </span>
          {source.variables_used && source.variables_used.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {source.variables_used.map((v) => (
                <span
                  key={v}
                  className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Colour helpers ──────────────────────────────────────────────────── */

function getChipColour(type?: Source["type"]) {
  if (type === "interview")
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
  if (type === "survey") return "bg-blue-100 text-blue-700 hover:bg-blue-200";
  return "bg-muted text-muted-foreground hover:bg-muted/80";
}

function getPillColour(type?: Source["type"]) {
  if (type === "interview") return "border-emerald-200 hover:bg-emerald-50";
  if (type === "survey") return "border-blue-200 hover:bg-blue-50";
  return "border-border hover:bg-accent";
}

/* ── Inline superscript chip ─────────────────────────────────────────── */

/** Inline superscript citation number — used inside markdown text.
 *  Interview [4]: tries to match the surrounding quote to a specific chunk
 *  and shows that chunk's moderator question in a small popover. Falls back
 *  to the full quotes drawer if no chunk is matched.
 *  All others: opens a small popover card. */
export function InlineCitationChip({
  source,
  precedingText,
  qCodes,
}: {
  source: Source;
  precedingText?: string;
  /** P246 Phase 1: per-sentence Q-code subset for the popover. Overrides source.question_codes. */
  qCodes?: string[] | null;
}) {
  const colourClass = getChipColour(source.type);
  const button = (
    <button
      className={`inline-flex h-[18px] min-w-[18px] cursor-pointer items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${colourClass}`}
      style={{ verticalAlign: "super" }}
    >
      {source.index}
    </button>
  );

  if (source.type === "interview") {
    const chunks = source.interview_chunks_data ?? [];
    const matched = precedingText ? findChunkByContext(chunks, precedingText) : null;

    if (matched) {
      const hasModQ =
        !!matched.moderator_question && matched.moderator_question.length >= 20;
      const chunkPreview = matched.chunk_preview?.trim() ?? "";
      const hasChunkPreview = chunkPreview.length >= 20;

      // Show popover if we have either a moderator question or a usable chunk preview.
      // P246 follow-up: v1 MIXED chunks (~58% of corpus) have no moderator_question —
      // previously these fell through to the full drawer even on a correct match.
      if (hasModQ || hasChunkPreview) {
        return (
          <Popover>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent
              className="w-80 p-3"
              sideOffset={8}
              align="end"
              collisionPadding={16}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm font-medium text-foreground">
                    {hasModQ ? "Moderator Question" : "Interview Quote"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {hasModQ
                    ? matched.moderator_question
                    : chunkPreview.length > 320
                      ? chunkPreview.slice(0, 320).trimEnd() + "…"
                      : chunkPreview}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {matched.interview_segment && (
                    <span className={getSegmentBadgeClasses(matched.interview_segment)}>
                      {matched.interview_segment}
                    </span>
                  )}
                  {[matched.interview_country, matched.interview_gender, matched.interview_age]
                    .filter(Boolean)
                    .map((tag, j) => (
                      <span key={j} className="text-[11px] text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      }
    }

    // Fallback: no chunk match at all → open full quotes drawer
    return <InterviewQuotesDialog source={source} trigger={button} />;
  }

  /* P271: [3] survey verbatim — structural per-quote demographic rendering.
   * findVerbatimByContext matches the AI's preceding quote text against the
   * SVL ground-truth array (`survey_chunks_data`). When matched, render the
   * authoritative Country + Gender + Age + Segment from the database — no
   * dependency on AI prose discipline.
   */
  if (source.type === "survey" && precedingText) {
    const verbatims = source.survey_chunks_data ?? [];
    const matchedV = verbatims.length > 0 ? findVerbatimByContext(verbatims, precedingText) : null;

    if (matchedV) {
      const demoLine = [matchedV.country, matchedV.gender_label, matchedV.age_band]
        .filter(Boolean)
        .join(" ");
      const englishIdx = (matchedV.verbatim || "").indexOf("[English]:");
      const cleanQuote = englishIdx >= 0
        ? (matchedV.verbatim || "").slice(englishIdx + "[English]:".length).trim()
        : (matchedV.verbatim || "").trim();
      const previewQuote = cleanQuote.length > 280 ? cleanQuote.slice(0, 280).trimEnd() + "…" : cleanQuote;
      const qcLabel = matchedV.question_code || source.question_code;

      // P287: detect cross-section verbatim mis-assignment.
      // Scan the LAST markdown section header (** ** or ## ) in the preceding
      // 600 chars and map it to an expected Q-code via the 5 OE topic→Q-code
      // mapping. If the matched DB row's question_code disagrees, render a
      // visual ⚠️ flag with hover note. Conservative — only flags when there's
      // a CLEAR section header that maps to a different OE topic. Layer 2 of
      // P287 (alongside Constraint #46 prompt fix). Surfaced 2026-04-27 chat 4195
      // (Q11B verbatim placed under "What sustainability means" Q1 section).
      const sectionMismatch = (() => {
        if (!matchedV.question_code) return null;
        const ctx = precedingText.slice(-600);
        // Match last `**Header**` or `## Header` in preceding context
        const headers = [
          ...ctx.matchAll(/\*\*([^*\n]{4,80})\*\*/g),
          ...ctx.matchAll(/(?:^|\n)#{1,3}\s+([^\n]{4,80})/g),
        ];
        if (headers.length === 0) return null;
        const lastHeader = headers[headers.length - 1][1].toLowerCase();
        // 5 OE topic → Q-code keyword map (mirrors Guardrail svlRoutedQCodes)
        let expectedQ: string | null = null;
        if (/\b(sustainability mean|what sustainability means|meaning|definition|own words)\b/.test(lastHeader)) expectedQ = "Q1";
        else if (/\b(saving people|associations|comes to mind)\b/.test(lastHeader)) expectedQ = "Q3";
        else if (/\b(cultural|religious|religion|faith|wudu|ablution)\b/.test(lastHeader)) expectedQ = "Q11B";
        else if (/\b(role model|inspires|admire|leader)\b/.test(lastHeader)) expectedQ = "Q20";
        else if (/\b(events shaped|what shaped|formative|turning point)\b/.test(lastHeader)) expectedQ = "Q21";
        if (!expectedQ) return null;
        // Compare expected vs actual; tolerate Q-code suffix variants (Q11 vs Q11B)
        const matchedBase = matchedV.question_code.replace(/[A-Z]$/, "");
        const expectedBase = expectedQ.replace(/[A-Z]$/, "");
        if (matchedV.question_code === expectedQ) return null;
        if (matchedBase === expectedBase) return null;
        return { expected: expectedQ, actual: matchedV.question_code, header: headers[headers.length - 1][1].trim() };
      })();

      return (
        <Popover>
          <PopoverTrigger asChild>{button}</PopoverTrigger>
          <PopoverContent
            className="w-80 p-3"
            sideOffset={8}
            align="end"
            collisionPadding={16}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0 text-violet-600" />
                <span className="text-sm font-medium text-foreground">
                  Survey verbatim {qcLabel ? `· ${qcLabel}` : ""}
                </span>
              </div>
              {/* P287 Layer 2: cross-section mis-attribution warning */}
              {sectionMismatch && (
                <div className="flex items-start gap-1.5 rounded border border-amber-300 bg-amber-50 p-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="text-[10px] leading-tight text-amber-800">
                    Possible mis-attribution: this quote is from <strong>{sectionMismatch.actual}</strong> but appears under a <strong>{sectionMismatch.expected}</strong> section header (&ldquo;{sectionMismatch.header}&rdquo;).
                  </p>
                </div>
              )}
              {matchedV.question_text && (
                <p className="text-[11px] italic leading-relaxed text-muted-foreground">
                  {matchedV.question_text}
                </p>
              )}
              <p className="text-xs leading-relaxed text-foreground">
                &ldquo;{previewQuote}&rdquo;
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {matchedV.segment_name && (
                  <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700">
                    {matchedV.segment_name}
                  </span>
                )}
                {demoLine && (
                  <span className="text-[11px] text-muted-foreground">{demoLine}</span>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }
    // P274f: no DB match → render unified verbatim popover from precedingText
    // (instead of falling through to generic SourceCardContent — which loses the
    // quote and shows generic "Survey Data / Q? / UK n=504" inconsistent with
    // the matched popover format).
    //
    // Surfaced when AI cites a verbatim from outside the SVL retrieval pool
    // (e.g. Q1 has 929 rows but SVL pool capped at 250 — AI may quote from
    // STM or rows 251-929 that DO exist in DB but aren't in current pool).
    // Renders the same "Survey verbatim · Q-code" branding so all verbatim
    // chips have consistent look-and-feel regardless of pool match success.
    if (verbatims.length > 0) {
      const recentText = precedingText.slice(-250);
      const hasQuotePattern =
        /(>\s*["“][^"“”\n]{15,})/.test(recentText) ||
        /["“][^"“”\n]{15,}["”]\s*$/.test(recentText.trim());

      if (hasQuotePattern) {
        // Dominant Q-code from SVL pool = the topic the AI was retrieving from
        const counts: Record<string, number> = {};
        for (const r of verbatims) {
          if (r.question_code) counts[r.question_code] = (counts[r.question_code] || 0) + 1;
        }
        const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const fallbackQCode = ranked.length > 0 ? ranked[0][0] : source.question_code || null;
        const fallbackQText = fallbackQCode ? Q_CODE_QUESTIONS[fallbackQCode] : null;
        const aiQuote = extractLastQuote(precedingText);
        const previewQuote = aiQuote && aiQuote.length > 280 ? aiQuote.slice(0, 280).trimEnd() + "…" : aiQuote;

        return (
          <Popover>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent
              className="w-80 p-3"
              sideOffset={8}
              align="end"
              collisionPadding={16}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 shrink-0 text-violet-600" />
                  <span className="text-sm font-medium text-foreground">
                    Survey verbatim {fallbackQCode ? `· ${fallbackQCode}` : ""}
                  </span>
                </div>
                {fallbackQText && (
                  <p className="text-[11px] italic leading-relaxed text-muted-foreground">
                    {fallbackQText}
                  </p>
                )}
                {previewQuote && (
                  <p className="text-xs leading-relaxed text-foreground">
                    &ldquo;{previewQuote}&rdquo;
                  </p>
                )}
                <p className="text-[10px] italic text-muted-foreground/70">
                  Respondent demographics not available — verbatim outside current retrieval pool.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        );
      }
    }
    // No quote pattern in preceding text → fall through to figure-mode popover
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        sideOffset={8}
        align="end"
        collisionPadding={16}
      >
        <SourceCardContent source={source} qCodesOverride={qCodes} />
      </PopoverContent>
    </Popover>
  );
}

/* ── Citation bar (below message) ────────────────────────────────────── */

/** Horizontal source list shown below an assistant message.
 *  Interview [4]: single pill labelled "Qualitative Interviews (N)" → opens quotes drawer.
 *  All others: pill → popover card. */
export function CitationBar({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <FileText className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Sources
        </span>
      </div>

      {sources.map((source) => {
        const pillInner = (
          <>
            <span
              className={`inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${getChipColour(source.type)}`}
            >
              {source.index}
            </span>
            {source.type === "interview" ? (
              <MessageSquareQuote className="h-3.5 w-3.5 text-emerald-600" />
            ) : source.type === "survey" ? (
              <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="max-w-[200px] truncate">
              {source.type === "interview"
                ? `Qualitative Interviews${source.quote_count ? ` (${source.quote_count})` : ""}`
                : source.type === "survey"
                ? "Survey Data"
                : source.document_title || source.filename}
            </span>
          </>
        );

        const pillClass = `inline-flex cursor-pointer items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs text-foreground transition-colors ${getPillColour(source.type)}`;

        if (source.type === "interview") {
          return (
            <InterviewQuotesDialog
              key={source.index}
              source={source}
              trigger={<button className={pillClass}>{pillInner}</button>}
            />
          );
        }

        return (
          <Popover key={source.index}>
            <PopoverTrigger asChild>
              <button
                className={pillClass}
                title={source.document_title || source.filename}
              >
                {pillInner}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-3"
              sideOffset={8}
              align="end"
              collisionPadding={16}
            >
              <SourceCardContent source={source} />
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
