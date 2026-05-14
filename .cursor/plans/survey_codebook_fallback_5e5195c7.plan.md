---
name: Survey codebook fallback
overview: Use the survey codebook as the static fallback source for tooltip question text when payload `question_text` is absent. Keep existing precedence rules and add resilient Q-code normalization for variants like row/item suffixes.
todos:
  - id: populate-codebook-map
    content: Populate Q-code fallback map in lib/survey-codes.ts from survey-codebook.md
    status: completed
  - id: add-code-normalization
    content: Implement robust code normalization in surveyQuestionText for r/c/oe variants
    status: completed
  - id: add-tests
    content: Add or update tests for exact and normalized fallback lookups
    status: completed
  - id: verify-tooltip-fallback
    content: Confirm citation tooltip shows fallback question text when question_text is missing
    status: completed
isProject: false
---

# Implement Survey Codebook Fallback for Tooltip Questions

## Scope

Wire the existing survey-tooltip fallback path to a populated codebook-backed map so survey citations show stable question wording even when API payloads omit `question_text`.

## Changes

- Update [`/Users/royalnashef/Desktop/smart-arse/lib/survey-codes.ts`](/Users/royalnashef/Desktop/smart-arse/lib/survey-codes.ts) to:
  - Populate `Q_CODE_QUESTIONS` from [`/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/survey-codebook.md`](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/survey-codebook.md).
  - Include canonical entries for base codes (`Q1`, `Q3`, `Q4`, `Q10`, etc.) and grouped families (`Q2`, `Q5`, `Q6`, `Q9`, `Q11`, `Q12`, `Q13`, `Q14`, `Q15`, `Q16`, `Q19`) using family-level question wording.
  - Add normalization in `surveyQuestionText()` so variants like `Q11r3`, `Q11r13oe`, `Q5r1`, `Q13r1c1` resolve to their base family question when exact key isn’t present.
  - Preserve graceful degradation to `""` when no match is found.

- Keep [`/Users/royalnashef/Desktop/smart-arse/lib/chat/citation-tooltip.tsx`](/Users/royalnashef/Desktop/smart-arse/lib/chat/citation-tooltip.tsx) precedence intact:
  - inline `questionText` → source `questionText` (matching code) → `surveyQuestionText(code)` → `chunkTopic`.
  - No rendering changes required unless normalization reveals obvious copy cleanup opportunities.

## Validation

- Add/adjust unit tests for [`/Users/royalnashef/Desktop/smart-arse/lib/survey-codes.ts`](/Users/royalnashef/Desktop/smart-arse/lib/survey-codes.ts) covering:
  - exact code lookups,
  - row/item/other-specify variants (`r`, `c`, `oe`) mapping to family text,
  - unknown codes returning empty string.
- Run targeted test/lint pass for changed files and verify tooltip examples like `Q10`/`Q11r*` render codebook wording when payload prose is absent.
