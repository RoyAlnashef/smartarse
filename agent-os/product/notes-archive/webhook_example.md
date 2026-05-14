# Webhook Payload Examples

---

## 1. Normal Chat

```json
{
  "chatInput": "What are the top barriers to sustainability among UK respondents?",
  "org_id": "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "request_id": "550e8400-e29b-41d4-a716-446655440001",
  "sessionId": "user-session-abc123",
  "weighted": true,
  "data_source_mode": "both",
  "qual_enabled": true
}
```

---

## 2. Segment Persona

> Triggered when a user clicks a segment chip.

```json
{
  "chatInput": "What's your biggest concern about sustainability?",
  "org_id": "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "request_id": "550e8400-e29b-41d4-a716-446655440002",
  "sessionId": "user-session-abc123",
  "weighted": true,
  "data_source_mode": "both",
  "qual_enabled": true,
  "persona_mode": true,
  "persona_brief": "You are a single respondent from the Do Their Bit for Others segment of the Sustainability & Culture Study 2025. This segment has high concern (8.4/10) and takes consistent action across multiple sustainability areas. Speak in first person ('I', 'we'). Never reference percentages or 'the data shows'.",
  "persona_brief_concern": 8.4
}
```

> `persona_brief` is composed by `buildSegmentBriefText(SEGMENT_PROFILES[segmentId])` from `lib/segments.ts` — the `segment_id` is resolved client-side to look up the template, then only the resulting text is sent.

---

## 3. Custom Audience

> Triggered when a user builds filters and clicks "Explore".

```json
{
  "chatInput": "What would convince you to buy more sustainable products?",
  "org_id": "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "request_id": "550e8400-e29b-41d4-a716-446655440003",
  "sessionId": "user-session-abc123",
  "weighted": true,
  "data_source_mode": "both",
  "qual_enabled": true,
  "persona_mode": true,
  "persona_brief": "You represent a custom audience from the Sustainability & Culture Study 2025: UK Females aged 25-34, weighted n=42. Concern level 7.2/10. This audience aligns with The Muddled Middle Majority archetype — earnest but hedging. Use qualifiers ('sort of', 'I suppose', 'I try to'). Speak in first person plural ('we'). Never reference percentages, never say 'the data shows'.",
  "persona_brief_concern": 7.2
}
```

> Same shape as #2 — the only difference is `persona_brief` is server-composed via `/api/audience/profile` (from filter values) rather than `buildSegmentBriefText()`.

---

## 4. Focus Group

> Frontend fires sequentially — one webhook call per participant. Each call mirrors the shape of #2 with a unique `persona_brief` and `persona_brief_concern` per participant. The roundtable view is assembled client-side.

**Participant 1:**

```json
{
  "chatInput": "Should we ban single-use plastic bags?",
  "org_id": "d0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "request_id": "550e8400-e29b-41d4-a716-446655440004",
  "sessionId": "fg-session-xyz",
  "weighted": true,
  "data_source_mode": "both",
  "qual_enabled": true,
  "persona_mode": true,
  "persona_brief": "You are a single respondent from the Do Nothing-ers segment...",
  "persona_brief_concern": 1.6
}
```

**Participant 2, 3, ...:** Same structure with their respective `persona_brief` and `persona_brief_concern` values.
