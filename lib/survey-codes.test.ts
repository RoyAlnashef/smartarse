import test from "node:test"
import assert from "node:assert/strict"
import {
  compareSurveyQuestionCodesNumerically,
  sortSurveyQuestionCodesNumerically,
  surveyQuestionText,
} from "@/lib/survey-codes"

test("returns exact question wording for known base code", () => {
  assert.equal(
    surveyQuestionText("Q10"),
    "How willing are you to make significant lifestyle changes in order to live more sustainably?"
  )
})

test("resolves row-based variants to family-level question", () => {
  assert.equal(
    surveyQuestionText("Q11r3"),
    "What barriers prevent you from living more sustainably?"
  )
  assert.equal(
    surveyQuestionText("Q11r13oe"),
    "What barriers prevent you from living more sustainably?"
  )
  assert.equal(
    surveyQuestionText("Q5r1"),
    "How much would you say you understand about the role of sustainability in each of the following areas?"
  )
})

test("resolves matrix cell variants to family-level question", () => {
  assert.equal(
    surveyQuestionText("Q13r1c1"),
    "To what extent do you agree or disagree with the following statements about sustainability and your role within it?"
  )
})

test("returns empty string for unknown code", () => {
  assert.equal(surveyQuestionText("Q999"), "")
})

test("sortSurveyQuestionCodesNumerically orders by leading question number", () => {
  assert.deepEqual(
    sortSurveyQuestionCodesNumerically(["Q19", "Q9", "Q11", "Q14", "Q12"]),
    ["Q9", "Q11", "Q12", "Q14", "Q19"]
  )
})

test("compareSurveyQuestionCodesNumerically puts Q before S before unknown", () => {
  const codes = ["S1", "Q2", "foo", "Q10", "Q9"]
  assert.deepEqual(sortSurveyQuestionCodesNumerically(codes), ["Q2", "Q9", "Q10", "S1", "foo"])
})

test("matrix-style codes sort by family question number", () => {
  assert.deepEqual(
    sortSurveyQuestionCodesNumerically(["Q11r3", "Q9", "Q5r1"]),
    ["Q5r1", "Q9", "Q11r3"]
  )
})
