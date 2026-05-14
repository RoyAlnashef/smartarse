import test from "node:test"
import assert from "node:assert/strict"
import {
  buildFooterSurveySyntheticInlineCitation,
  countBareCitationMarkersForIndex,
} from "@/lib/chat/inline-citations"
import type { ChatInlineCitation } from "@/lib/types"

test("countBareCitationMarkersForIndex counts bare markers only", () => {
  assert.equal(countBareCitationMarkersForIndex("a [3] b [3] c", 3), 2)
  assert.equal(countBareCitationMarkersForIndex("a [3](url) b [3]", 3), 1)
  assert.equal(countBareCitationMarkersForIndex("no markers", 3), 0)
})

test("buildFooterSurveySyntheticInlineCitation merges repeated Q4 markers", () => {
  const content = "x [3] y [3] z [3] w [3]"
  const inline: ChatInlineCitation[] = [
    { sourceIndex: 3, marker_position: 2, q_codes: ["Q4"] },
    { sourceIndex: 3, marker_position: 8, q_codes: ["Q4"] },
    { sourceIndex: 3, marker_position: 14, q_codes: ["Q4"] },
    { sourceIndex: 3, marker_position: 20, q_codes: ["Q4"] },
  ]
  const out = buildFooterSurveySyntheticInlineCitation(3, content, inline)
  assert.ok(out)
  assert.deepEqual(out!.q_codes, ["Q4"])
})

test("buildFooterSurveySyntheticInlineCitation unions distinct q_codes in slice order", () => {
  const content = "a [3] b [3]"
  const inline: ChatInlineCitation[] = [
    { sourceIndex: 3, marker_position: 2, q_codes: ["Q4"] },
    { sourceIndex: 3, marker_position: 8, q_codes: ["Q8"] },
  ]
  const out = buildFooterSurveySyntheticInlineCitation(3, content, inline)
  assert.ok(out)
  assert.deepEqual(out!.q_codes, ["Q4", "Q8"])
})

test("buildFooterSurveySyntheticInlineCitation limits rows to marker count", () => {
  const content = "only [3] once"
  const inline: ChatInlineCitation[] = [
    { sourceIndex: 3, marker_position: 5, q_codes: ["Q4"] },
    { sourceIndex: 3, marker_position: 99, q_codes: ["Q8"] },
  ]
  const out = buildFooterSurveySyntheticInlineCitation(3, content, inline)
  assert.ok(out)
  assert.deepEqual(out!.q_codes, ["Q4"])
})

test("buildFooterSurveySyntheticInlineCitation returns null when inlineCitations empty", () => {
  assert.equal(
    buildFooterSurveySyntheticInlineCitation(3, "text [3]", null),
    null
  )
})

test("buildFooterSurveySyntheticInlineCitation returns null when no bare markers", () => {
  const inline: ChatInlineCitation[] = [
    { sourceIndex: 3, marker_position: 0, q_codes: ["Q4"] },
  ]
  assert.equal(buildFooterSurveySyntheticInlineCitation(3, "no citation", inline), null)
})

test("buildFooterSurveySyntheticInlineCitation returns null when slice has no q_codes", () => {
  const content = "x [3]"
  const inline: ChatInlineCitation[] = [
    { sourceIndex: 3, marker_position: 2, q_codes: null },
  ]
  assert.equal(buildFooterSurveySyntheticInlineCitation(3, content, inline), null)
})
