/**
 * Baseline study segment definitions (2025 study). Display fields can be overridden per project
 * via {@link resolveSegmentPersonasFromFiles} from `project_personas` rows bound to a canonical id.
 */
export type PersonaMock = {
  id: string
  segmentCode: string
  title: string
  shortDescription: string
  /** Legacy Tailwind bg class; prefer {@link PersonaMock.colorCiteToken} for new UI. */
  dotClassName: string
  /**
   * Resolved cite palette token (e.g. `indigo-500`) for dots and denormalized chat metadata.
   * Always set on {@link MOCK_SEGMENT_PERSONAS} and on outputs from {@link resolveSegmentPersonasFromFiles}.
   */
  colorCiteToken: string
  surveyN: number
  surveyPctLabel: string
  avgConcern: string
  avgActions: string
  concernScore: number
  qualitativeInterviews: number
  voiceQuote: string
  voiceReference: string
  suggestedQuestions: string[]
}

export const MOCK_SEGMENT_PERSONAS: PersonaMock[] = [
  {
    id: "seg-do-nothing",
    segmentCode: "S1",
    title: "The Do Nothing-ers",
    shortDescription:
      "Very low concern level for sustainability. Actively doing very few sustainable behaviours.",
    dotClassName: "bg-indigo-500",
    colorCiteToken: "indigo-500",
    surveyN: 66,
    surveyPctLabel: "6.6%",
    avgConcern: "2.1/10",
    avgActions: "0.8",
    concernScore: 1.6,
    qualitativeInterviews: 6,
    voiceQuote:
      "I don’t really think about it day to day — if it’s easy I might, but I’m not changing my routine.",
    voiceReference: "UK, 34, Female",
    suggestedQuestions: [
      "What does sustainability mean to this segment?",
      "What would nudge them toward one small behaviour change?",
      "How do they compare price vs. eco labels?",
    ],
  },
  {
    id: "seg-minimalists",
    segmentCode: "S2",
    title: "The Minimalists",
    shortDescription:
      "Low concern level for sustainability. Doing few sustainable behaviours.",
    dotClassName: "bg-sky-500",
    colorCiteToken: "sky-500",
    surveyN: 112,
    surveyPctLabel: "11.1%",
    avgConcern: "3.8/10",
    avgActions: "1.6",
    concernScore: 5.11,
    qualitativeInterviews: 6,
    voiceQuote:
      "I’ll do the basics if it’s not disruptive — turn off lights, maybe reuse a bag sometimes.",
    voiceReference: "KSA, 29, Male",
    suggestedQuestions: [
      "Which sustainable actions feel ‘easy enough’ for them?",
      "What erodes trust in green messaging?",
    ],
  },
  {
    id: "seg-muddled-middle",
    segmentCode: "S3",
    title: "The Muddled Middle Majority",
    shortDescription:
      "Medium concern level for sustainability. Doing some sustainable behaviours but feeling overwhelmed.",
    dotClassName: "bg-violet-600",
    colorCiteToken: "violet-600",
    surveyN: 508,
    surveyPctLabel: "50.4%",
    avgConcern: "6.55/10",
    avgActions: "3.9",
    concernScore: 6.55,
    qualitativeInterviews: 39,
    voiceQuote:
      "I want to do the right thing, but it’s confusing — too many labels, too much conflicting advice.",
    voiceReference: "UK, 38, Female",
    suggestedQuestions: [
      "What does sustainability mean to this segment?",
      "What barriers stop them from doing more?",
      "How do they interpret eco labels and claims?",
    ],
  },
  {
    id: "seg-do-their-bit",
    segmentCode: "S4",
    title: "Do Their Bit for Others",
    shortDescription:
      "High concern level for sustainability. Actively doing a lot of sustainable behaviours.",
    dotClassName: "bg-yellow-500",
    colorCiteToken: "yellow-500",
    surveyN: 240,
    surveyPctLabel: "23.8%",
    avgConcern: "8.4/10",
    avgActions: "6.2",
    concernScore: 9.66,
    qualitativeInterviews: 11,
    voiceQuote:
      "It matters for my kids’ future — I’ll adjust what I buy, how I travel, and what I support.",
    voiceReference: "UK, 33, Male",
    suggestedQuestions: [
      "What proof do they need before they advocate a brand?",
      "Where do they still feel stuck despite high intent?",
    ],
  },
]
