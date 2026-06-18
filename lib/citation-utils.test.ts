import { describe, expect, it } from "vitest"
import { findVerbatimByContext } from "@/lib/citation-utils"
import type { SurveyChunkData } from "@/lib/types"

const SAMPLE_VERBATIM: SurveyChunkData = {
  verbatim:
    "Sustainability is the ability of maintaining a process without depleting natural resources",
  question_code: "Q1",
  question_text: "In your own words, what does sustainability mean to you?",
  country: "UK",
  gender_label: "Male",
  age_band: "25-34",
  segment_name: "Do Their Bit for Others",
}

describe("findVerbatimByContext", () => {
  it("matches when the AI quote is a forward substring of the verbatim row", () => {
    const preceding =
      'Respondents said "maintaining a process without depleting natural resources" [3]'
    expect(findVerbatimByContext([SAMPLE_VERBATIM], preceding)).toEqual(
      SAMPLE_VERBATIM
    )
  })

  it("matches bilingual rows via the [English]: suffix", () => {
    const bilingual: SurveyChunkData = {
      ...SAMPLE_VERBATIM,
      verbatim:
        "[Arabic]: …\n\n[English]: Sustainability is the ability of maintaining a process without depleting natural resources",
    }
    const preceding =
      '"Sustainability is the ability of maintaining a process without depleting natural resources" [3]'
    expect(findVerbatimByContext([bilingual], preceding)).toEqual(bilingual)
  })

  it("matches short verbatims on exact normalised equality", () => {
    const shortRow: SurveyChunkData = {
      ...SAMPLE_VERBATIM,
      verbatim: "Reuse",
    }
    expect(findVerbatimByContext([shortRow], 'One said "Reuse" [3]')).toEqual(
      shortRow
    )
  })

  it("returns null when no row matches", () => {
    expect(
      findVerbatimByContext([SAMPLE_VERBATIM], '"Totally unrelated quote" [3]')
    ).toBeNull()
  })
})
