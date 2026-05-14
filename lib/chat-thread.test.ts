import { describe, expect, it } from "vitest"
import {
  MESSAGE_THREAD_KEY,
  buildContextActivationStoredJson,
  ensureActivationPrefixInResultRecord,
  isoOneMsBefore,
  mergeJobIntoAnchorPayload,
  parseThreadEntries,
  threadContainsContextActivation,
  threadHasActivationPrefix,
  type ThreadStoredMessage,
} from "@/lib/chat-thread"
import { buildSurveySamplePillText } from "@/lib/chat/citation-tooltip"

describe("chat-thread activation persistence", () => {
  it("isoOneMsBefore orders activation before same-ms user turn", () => {
    const base = "2026-05-11T12:00:00.000Z"
    expect(new Date(isoOneMsBefore(base)).getTime()).toBeLessThan(
      new Date(base).getTime()
    )
  })

  it("parseThreadEntries coerces stored citations through parseCitationSource (snake_case base_size)", () => {
    const payload = {
      [MESSAGE_THREAD_KEY]: [
        {
          id: "u",
          role: "user",
          content: "Q",
          timestamp: "2026-05-11T12:00:00.000Z",
        },
        {
          id: "a",
          role: "assistant",
          content: "A [3]",
          timestamp: "2026-05-11T12:00:01.000Z",
          citations: [
            {
              index: 3,
              source_type: "survey",
              sample_description: "UK",
              base_size: 504,
            },
          ],
        },
      ],
    }
    const entries = parseThreadEntries(payload, "2026-05-11T12:00:00.000Z")
    const assistant = entries.find(
      (e): e is ThreadStoredMessage => "role" in e && e.role === "assistant"
    )
    expect(assistant?.citations?.[0].baseSize).toBe(504)
    expect(assistant?.citations?.[0].sampleDescription).toBe("UK")
    expect(assistant?.citations?.[0].sourceType).toBe("survey")
    expect(buildSurveySamplePillText(assistant!.citations![0])).toBe("UK, n=504")
  })

  it("buildSurveySamplePillText falls back to 'All Respondents' when no sample metadata", () => {
    const survey = {
      index: 1,
      displayName: null,
      documentTitle: null,
      sourceFileName: null,
      excerpt: null,
      url: null,
      sourceType: "survey",
      sourceCategory: null,
      questionCode: null,
      questionText: null,
      questionCodes: ["Q4", "Q8"],
      respondentGroup: null,
      sampleSize: null,
      variablesUsed: null,
      recordManagerId: null,
      iconName: null,
      iconType: null,
      iconUrl: null,
      sampleDescription: null,
      baseSize: null,
    }
    expect(buildSurveySamplePillText(survey)).toBe("All Respondents")
  })

  it("parseThreadEntries preserves activation and messages in order", () => {
    const payload = {
      [MESSAGE_THREAD_KEY]: [
        {
          kind: "persona_activated",
          id: "persona-act-1",
          timestamp: "2026-05-11T11:59:59.999Z",
          personaId: "seg-a",
        },
        {
          id: "u1",
          role: "user",
          content: "Hello",
          timestamp: "2026-05-11T12:00:00.000Z",
        },
        {
          id: "a1",
          role: "assistant",
          content: "Hi",
          timestamp: "2026-05-11T12:00:01.000Z",
        },
      ],
    }
    const entries = parseThreadEntries(payload, "2026-05-11T12:00:00.000Z")
    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({ kind: "persona_activated" })
    expect(entries[1]).toMatchObject({ role: "user", content: "Hello" })
  })

  it("threadContainsContextActivation and threadHasActivationPrefix", () => {
    const entries = parseThreadEntries(
      {
        [MESSAGE_THREAD_KEY]: [
          {
            kind: "custom_audience_activated",
            id: "c1",
            timestamp: "t0",
            customAudienceName: "Test",
            childSegmentNames: ["A"],
            baseSize: null,
            avgConcern: null,
          },
        ],
      },
      "t0"
    )
    expect(threadContainsContextActivation(entries)).toBe(true)
    expect(threadHasActivationPrefix(entries)).toBe(true)
  })

  it("ensureActivationPrefixInResultRecord is idempotent", () => {
    const denorm = {
      chatContextMode: "persona_segment" as const,
      personaSegmentId: "p1",
      customAudienceId: null,
      customAudienceName: null,
      customAudienceChildSegmentNames: null,
      requestIdForActivationId: "req-anchor",
    }
    const base: Record<string, unknown> = {
      answer: "ok",
      [MESSAGE_THREAD_KEY]: [
        {
          kind: "persona_activated",
          id: "persona-act-req-anchor",
          timestamp: isoOneMsBefore("2026-05-11T12:00:00.000Z"),
          personaId: "p1",
        },
        {
          id: "u",
          role: "user",
          content: "Q",
          timestamp: "2026-05-11T12:00:00.000Z",
        },
        {
          id: "a",
          role: "assistant",
          content: "A",
          timestamp: "2026-05-11T12:00:00.000Z",
        },
      ],
    }
    const once = ensureActivationPrefixInResultRecord(base, {
      user_query: "Q",
      firstUserTimestamp: "2026-05-11T12:00:00.000Z",
      denorm,
    })
    const twice = ensureActivationPrefixInResultRecord(once, {
      user_query: "Q",
      firstUserTimestamp: "2026-05-11T12:00:00.000Z",
      denorm,
    })
    expect(twice[MESSAGE_THREAD_KEY]).toEqual(once[MESSAGE_THREAD_KEY])
  })

  it("mergeJobIntoAnchorPayload prepends activation when thread exists without it", () => {
    const anchorPayload: Record<string, unknown> = {
      answer: "first answer",
      [MESSAGE_THREAD_KEY]: [
        {
          id: "u0",
          role: "user",
          content: "first q",
          timestamp: "2026-05-11T12:00:00.000Z",
        },
        {
          id: "a0",
          role: "assistant",
          content: "first answer",
          timestamp: "2026-05-11T12:00:00.000Z",
        },
      ],
    }
    const merged = mergeJobIntoAnchorPayload({
      anchorRequestId: "anchor-1",
      anchorPayload,
      anchorUserQuery: "first q",
      anchorCreatedAt: "2026-05-11T12:00:00.000Z",
      jobRequestId: "job-2",
      followUpUserQuestion: "second q",
      newResult: { answer: "second answer" },
      userTimestamp: "2026-05-11T12:05:00.000Z",
      assistantTimestamp: "2026-05-11T12:05:01.000Z",
      contextDenorm: {
        chatContextMode: "persona_segment",
        personaSegmentId: "seg-1",
        customAudienceId: null,
        customAudienceName: null,
        customAudienceChildSegmentNames: null,
        requestIdForActivationId: "anchor-1",
      },
    })
    const thread = merged[MESSAGE_THREAD_KEY] as unknown[]
    expect(Array.isArray(thread)).toBe(true)
    expect((thread[0] as { kind: string }).kind).toBe("persona_activated")
    expect((thread[1] as { role: string }).role).toBe("user")
  })

  it("mergeJobIntoAnchorPayload adds prefix on first merge from empty thread", () => {
    const merged = mergeJobIntoAnchorPayload({
      anchorRequestId: "anchor-1",
      anchorPayload: { answer: "first answer" },
      anchorUserQuery: "first q",
      anchorCreatedAt: "2026-05-11T12:00:00.000Z",
      jobRequestId: "job-2",
      followUpUserQuestion: "second q",
      newResult: { answer: "second answer" },
      userTimestamp: "2026-05-11T12:05:00.000Z",
      assistantTimestamp: "2026-05-11T12:05:01.000Z",
      contextDenorm: {
        chatContextMode: "persona_segment",
        personaSegmentId: "seg-1",
        customAudienceId: null,
        customAudienceName: null,
        customAudienceChildSegmentNames: null,
        requestIdForActivationId: "anchor-1",
      },
    })
    const thread = merged[MESSAGE_THREAD_KEY] as unknown[]
    expect((thread[0] as { kind: string }).kind).toBe("persona_activated")
  })

  it("buildContextActivationStoredJson returns null for default mode", () => {
    expect(
      buildContextActivationStoredJson(
        {
          chatContextMode: "default",
          personaSegmentId: "x",
          customAudienceId: null,
          customAudienceName: null,
          customAudienceChildSegmentNames: null,
          requestIdForActivationId: "r",
        },
        "2026-05-11T12:00:00.000Z"
      )
    ).toBeNull()
  })
})
