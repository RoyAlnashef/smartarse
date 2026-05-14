"use client";

import React, { useMemo } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseInlineCitations } from "@/lib/citation-utils";
import { InlineCitationChip } from "@/components/CitationChip";
import { VisualizationRenderer } from "@/components/VisualizationRenderer";
import type { InlineCitation, Source, Visualization } from "@/lib/types";

/**
 * Recursively extract plain text from a React node tree.
 * Used to populate prevTextCtx from non-text siblings (e.g. <em> nodes)
 * so that a [N] marker immediately after *"quote"* can still match.
 */
function extractTextContent(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node))
    return (node as React.ReactNode[]).map(extractTextContent).join("");
  if (React.isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    if (props.children)
      return extractTextContent(props.children as React.ReactNode);
  }
  return "";
}

/**
 * Recursively walk React children, replacing `[N]` text markers
 * with InlineCitationChip components.
 */
/** P246 Phase 1: per-index marker counter. Mutated as each [3]/[4] marker is rendered
 *  so we can line up against the inline_citations array (ordered by marker_position). */
type MarkerCounters = { 3: number; 4: number };

/** Per-chip dedup map. Key = `${idx}|${precedingText.slice(-50)}`. Reused across
 *  recursive injectCitations calls within ONE render pass so counter advances
 *  exactly once per logical citation marker, regardless of how many times the
 *  React tree is walked.
 *  P273-BugC root cause (2026-04-26): consumeInline was being called more than
 *  once per [3] marker because react-markdown calls handlers for every element
 *  type AND injectCitations recurses into element children. Some markers got
 *  consumed 2+ times → counter overflowed → late chips received undefined →
 *  popover fell back to source.question_codes union ("Multiple survey questions
 *  cited here / Q1 · Q5"). The dedup map below makes consumeInline idempotent. */
type ConsumedMap = Map<string, InlineCitation | undefined>;

function injectCitations(
  children: React.ReactNode,
  sources: Source[],
  inlineCitations: InlineCitation[] | undefined,
  counters: MarkerCounters,
  consumed: ConsumedMap,
  /** Raw answer content string — used to extract precedingText from marker_position
   *  when [4] lands in its own paragraph element (no preceding text in that node). */
  content: string
): React.ReactNode {
  /** Pull the inline_citations entry corresponding to this chip.
   *
   *  P274c (2026-04-26) — STABLE-IDENTITY DEDUP via marker_position:
   *  The chip is identified by its absolute marker_position in `content`, not by
   *  the per-handler `precedingText` slice. This makes dedup stable across the
   *  multiple ReactMarkdown handler invocations that touch the same logical chip
   *  (blockquote, paragraph, etc. each call inject() which calls consumeInline).
   *
   *  Why P273-BugC's precedingText-based dedup wasn't enough:
   *  ReactMarkdown calls per-element-type handlers with DIFFERENT text node
   *  contents for the same chip. The blockquote handler passes just the quoted
   *  text; the paragraph handler may pass surrounding context. precedingText.length
   *  + content differs across calls → different dedup keys → counter advances
   *  multiple times for one logical chip → subsequent chips get the wrong ic.
   *  Surfaced as off-by-one in mixed figure+verbatim responses (chat 3957). */
  const consumeInline = (idx: number, precedingText: string): InlineCitation | undefined => {
    if (!inlineCitations || (idx !== 3 && idx !== 4)) return undefined;

    // Locate the chip's absolute marker_position in `content` by searching for
    // its precedingText tail immediately followed by the [N] marker token.
    // ReactMarkdown processes the document top-to-bottom, so the FIRST occurrence
    // of (tail + marker) we haven't yet consumed is this chip.
    let markerPos: number | null = null;
    const tail = precedingText.replace(/\s+/g, " ").trim();
    const markerToken = `[${idx}]`;
    if (tail.length >= 8) {
      const tailKey = tail.slice(-50);
      // P289 (Trap DD recurrence): tail is whitespace-collapsed but `content`
      // is raw and may contain double-spaces or different whitespace from the
      // React-rendered precedingText. Plain indexOf() on raw content fails when
      // the verbatim has e.g. "Using and reusing  resources careful" (double
      // space in DB) but React rendered it with single space — tailKey ends up
      // single-space, content has double-space, indexOf returns -1, marker_position
      // search fails, falls to counter fallback, counter overflows from
      // multi-handler invocations on prior chips, wrong InlineCitation returned.
      // Surfaced 2026-04-27 chat 4205 Quote 2 chip showed Quote 1's popover.
      // Fix: try plain indexOf first (fast path for common case), fall back to
      // whitespace-tolerant regex match (escape regex specials, replace \s with \s+).
      let searchFrom = 0;
      while (searchFrom < content.length) {
        const tailIdx = content.indexOf(tailKey, searchFrom);
        if (tailIdx === -1) break;
        const lookahead = content.slice(tailIdx + tailKey.length, tailIdx + tailKey.length + 30);
        const mtokIdx = lookahead.indexOf(markerToken);
        if (mtokIdx !== -1 && mtokIdx < 20) {
          markerPos = tailIdx + tailKey.length + mtokIdx;
          break;
        }
        searchFrom = tailIdx + 1;
      }
      // P289 fallback: whitespace-tolerant regex match if literal indexOf failed.
      if (markerPos === null) {
        const escaped = tailKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const flexible = escaped.replace(/\s+/g, "\\s+");
        try {
          const re = new RegExp(flexible, "g");
          let m: RegExpExecArray | null;
          while ((m = re.exec(content)) !== null) {
            const tailEnd = m.index + m[0].length;
            const lookahead = content.slice(tailEnd, tailEnd + 30);
            const mtokIdx = lookahead.indexOf(markerToken);
            if (mtokIdx !== -1 && mtokIdx < 20) {
              markerPos = tailEnd + mtokIdx;
              break;
            }
          }
        } catch {
          // Regex compile failure (very long tailKey edge case) — leave markerPos null.
        }
      }
    }

    if (markerPos !== null) {
      const dedupKey = `${idx}|p${markerPos}`;
      if (consumed.has(dedupKey)) return consumed.get(dedupKey);
      const ic = inlineCitations.find(
        (c) => c.index === idx && c.marker_position === markerPos
      );
      consumed.set(dedupKey, ic);
      return ic;
    }

    // Fallback (P273-BugC): counter-based assignment when marker_position search
    // fails (e.g. precedingText is too short or doesn't end near a marker).
    // Dedup key uses full precedingText so re-entrant calls with the SAME
    // precedingText still return the cached result.
    const fallbackKey = `${idx}|fb|${precedingText.length}|${precedingText}`;
    if (consumed.has(fallbackKey)) return consumed.get(fallbackKey);
    const i = counters[idx as 3 | 4];
    counters[idx as 3 | 4] += 1;
    let seen = 0;
    let found: InlineCitation | undefined = undefined;
    for (const ic of inlineCitations) {
      if (ic.index === idx) {
        if (seen === i) { found = ic; break; }
        seen += 1;
      }
    }
    consumed.set(fallbackKey, found);
    return found;
  };

  // react-markdown v10 passes children as a plain string to block-level custom
  // components (p, h1, h2, li, strong, em, etc.). Short-circuit React.Children.map
  // here to avoid the nested-array issue: map(string, fn → array) returns [[...]]
  // which React 19 does not unwrap, causing citation markers to render as raw text.
  if (typeof children === "string") {
    const segments = parseInlineCitations(children);
    if (segments.length === 1 && segments[0].type === "text") return children;
    return segments.map((seg, i) => {
      if (seg.type === "text") return seg.value;
      // P262 (D2): re-enable [1]/[2] pills per user feedback (2026-04-24).
      // Reverts P241 string-children suppression. Popover uses source-level metadata
      // (chunk_topic + document_title); pages dropped from chip per P262 (D3).
      const source = sources.find((s) => s.index === seg.index);
      if (!source) return (
        <span
          key={`ghost-${seg.index}-${i}`}
          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground"
          style={{ verticalAlign: "super" }}
        >
          {seg.index}
        </span>
      );
      const inline = consumeInline(seg.index, seg.precedingText);
      // Prefer marker_position-based extraction: [4] is often in its own <p>
      // with no preceding text in the node. Raw string offset is always reliable.
      const effectivePreceding = inline
        ? content.slice(Math.max(0, inline.marker_position - 200), inline.marker_position)
        : seg.precedingText;
      return (
        <InlineCitationChip
          key={`cite-${seg.index}-${i}`}
          source={source}
          precedingText={effectivePreceding}
          qCodes={inline?.q_codes ?? undefined}
        />
      );
    });
  }

  // remark-gfm parses [N] as a linkReference AST node, splitting the citation
  // marker into its own text node separate from the preceding quote text.
  // We accumulate text across sibling nodes so that when [N] has empty
  // precedingText (because it's in its own node), we fall back to the
  // accumulated preceding sibling text for findChunkByContext matching.
  let prevTextCtx = "";
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      const segments = parseInlineCitations(child);
      if (segments.length === 1 && segments[0].type === "text") {
        prevTextCtx += child; // accumulate for next sibling
        return child;
      }
      return segments.map((seg, i) => {
        if (seg.type === "text") {
          prevTextCtx += seg.value;
          return seg.value;
        }
        // P262 (D2): re-enable [1]/[2] pills per user feedback (2026-04-24).
        // Reverts P241 React.Children.map suppression.
        const source = sources.find((s) => s.index === seg.index);
        if (!source) return (
          <span
            key={`ghost-${seg.index}-${i}`}
            className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground"
            style={{ verticalAlign: "super" }}
          >
            {seg.index}
          </span>
        );
        const inline = consumeInline(seg.index, seg.precedingText || prevTextCtx);
        // Prefer marker_position-based extraction (reliable across element boundaries).
        // Fall back to prevTextCtx / seg.precedingText only when ic is absent.
        const effectivePrecedingText = inline
          ? content.slice(Math.max(0, inline.marker_position - 200), inline.marker_position)
          : (seg.precedingText.trim().length > 10 ? seg.precedingText : prevTextCtx);
        prevTextCtx = ""; // reset after citation consumed it
        return (
          <InlineCitationChip
            key={`cite-${seg.index}-${i}`}
            source={source}
            precedingText={effectivePrecedingText}
            qCodes={inline?.q_codes ?? undefined}
          />
        );
      });
    }
    // Non-text child (e.g. <em>, <strong>): extract its text content into the
    // accumulator so that a [N] marker AFTER *"quote"* can still find the quote.
    prevTextCtx += extractTextContent(child);
    if (React.isValidElement(child)) {
      const props = child.props as Record<string, unknown>;
      if (props.children) {
        return React.cloneElement(
          child,
          undefined,
          ...React.Children.toArray(
            injectCitations(props.children as React.ReactNode, sources, inlineCitations, counters, consumed, content)
          )
        );
      }
    }
    return child;
  });
}

function createComponents(
  sources: Source[],
  inlineCitations: InlineCitation[] | undefined,
  counters: MarkerCounters,
  consumed: ConsumedMap,
  content: string
): Components {
  const inject = (children: React.ReactNode) =>
    sources.length > 0
      ? injectCitations(children, sources, inlineCitations, counters, consumed, content)
      : children;

  return {
    h1: ({ children }) => (
      <h2 className="mb-3 mt-6 first:mt-0 text-lg font-semibold tracking-tight text-foreground">
        {inject(children)}
      </h2>
    ),
    h2: ({ children }) => (
      <h3 className="mb-2 mt-5 first:mt-0 text-base font-semibold tracking-tight text-foreground">
        {inject(children)}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mb-2 mt-4 first:mt-0 text-sm font-semibold text-foreground">
        {inject(children)}
      </h4>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-relaxed text-foreground/90">
        {inject(children)}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 ml-1 space-y-1.5 text-sm">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-1 list-decimal space-y-1.5 pl-4 text-sm">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="flex items-start gap-2 leading-relaxed text-foreground/90">
        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
        <span className="flex-1">{inject(children)}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">
        {inject(children)}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-foreground/80">{inject(children)}</em>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-3 rounded-lg border-l-3 border-primary/50 bg-primary/5 py-2 pl-4 pr-3">
        {inject(children)}
      </blockquote>
    ),
    // Code blocks — NO citation injection (render [N] as literal text)
    code: ({ className, children }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <div className="my-3 overflow-hidden rounded-lg border border-border bg-muted/50">
            <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {className?.replace("language-", "") || "code"}
              </span>
            </div>
            <pre className="overflow-x-auto p-3">
              <code className="text-xs leading-relaxed text-foreground">
                {children}
              </code>
            </pre>
          </div>
        );
      }
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
          {children}
        </code>
      );
    },
    table: ({ children }) => (
      <div className="my-3 overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">{children}</table>
        </div>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted/60">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-t border-border px-3 py-2 text-xs text-foreground/80">
        {inject(children)}
      </td>
    ),
    hr: () => <hr className="my-4 border-border" />,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary/60"
      >
        {children}
      </a>
    ),
  };
}

/**
 * Split markdown at <!--chart:ID--> markers.
 * Returns alternating segments: [markdown, chartId, markdown, chartId, ...]
 */
function splitAtChartMarkers(
  content: string
): Array<{ type: "markdown"; text: string } | { type: "chart"; id: string }> {
  const pattern = /<!--chart:(\w+)-->/g;
  const segments: Array<
    { type: "markdown"; text: string } | { type: "chart"; id: string }
  > = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // Push markdown segment before the marker
    if (match.index > lastIndex) {
      segments.push({
        type: "markdown",
        text: content.slice(lastIndex, match.index),
      });
    }
    // Push chart marker
    segments.push({ type: "chart", id: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Push remaining markdown after the last marker
  if (lastIndex < content.length) {
    segments.push({ type: "markdown", text: content.slice(lastIndex) });
  }

  // If no markers found, return the whole content as one segment
  if (segments.length === 0) {
    segments.push({ type: "markdown", text: content });
  }

  return segments;
}

interface MarkdownResponseProps {
  content: string;
  sources?: Source[];
  visualizations?: Visualization[];
  /** P246 Phase 1: per-marker Q-code granularity for [3]/[4] inline popovers */
  inlineCitations?: InlineCitation[];
}

export function MarkdownResponse({
  content,
  sources = [],
  visualizations = [],
  inlineCitations,
}: MarkdownResponseProps) {
  // P273-BugC fix (2026-04-26): counters MUST be recreated every render and
  // components MUST be rebuilt every render. Previously this was inside useMemo,
  // which cached the components object across renders. Strict Mode (dev) and
  // concurrent rendering can cause the same render function to be called multiple
  // times — useMemo cache hits returned the SAME components closure with the SAME
  // counters reference, which had already been mutated by the prior pass.
  // Result: late chips (intro [3], 3rd quote [3]) lost their qCodes prop →
  // SourceCardContent fell back to source.question_codes union → user saw
  // "Multiple survey questions cited here / Q11 · Q2" on pills that should have
  // shown clean per-marker single-Q popovers.
  // Trade-off: ReactMarkdown re-processes on every parent re-render. Minor cost,
  // correct behaviour. The actual heavy computation (parseInlineCitations,
  // findVerbatimByContext) is still cached at the chip level.
  const counters: MarkerCounters = { 3: 0, 4: 0 };
  const consumed: ConsumedMap = new Map();
  const components = createComponents(sources, inlineCitations, counters, consumed, content);
  const vizMap = useMemo(() => {
    const map = new Map<string, Visualization>();
    for (const v of visualizations) {
      map.set(v.id, v);
    }
    return map;
  }, [visualizations]);

  // If no visualizations, render the simple path (no splitting needed)
  if (visualizations.length === 0) {
    return (
      <div className="markdown-response">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Split content at chart markers and render interleaved
  const segments = splitAtChartMarkers(content);

  return (
    <div className="markdown-response">
      {segments.map((seg, i) => {
        if (seg.type === "markdown") {
          const trimmed = seg.text.trim();
          if (!trimmed) return null;
          return (
            <ReactMarkdown
              key={`md-${i}`}
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {trimmed}
            </ReactMarkdown>
          );
        }

        // Chart marker — find the matching visualization
        const viz = vizMap.get(seg.id);
        if (!viz) return null;
        return <VisualizationRenderer key={`viz-${seg.id}`} visualization={viz} />;
      })}
    </div>
  );
}
