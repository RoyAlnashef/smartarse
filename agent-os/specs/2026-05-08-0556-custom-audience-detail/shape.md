# Custom Audience Detail - Shaping Notes

## Scope

Build the Custom Audience tab into a production-ready flow that:
- provides a dedicated Custom Audience detail screen from the locked prototype visual,
- behaves like persona detail (open/close/apply/clear semantics),
- allows full saved-audience persistence (not session-only),
- applies active custom audience context to chat like persona segments do,
- forwards the audience context into LLM webhook payloads,
- persists/restores the context through chat history,
- renders stacked child-segment dots in both client and dashboard chat-history surfaces.

## Decisions

- **Persistence included now:** Full save/list/select/update support for custom audiences is in scope for this phase.
- **Behavior parity:** Custom audience detail behavior must mirror persona detail behavior.
- **Visual direction:** Keep current app visual language as the base, but lock the provided prototype image as the source for custom-audience detail screen structure and interactions.
- **History visuals:** Custom audiences use stacked child-segment dots; persona history keeps single-dot behavior.
- **Payload safety:** Extend mode-aware payload/persist contracts without regressing existing persona-segment behavior.

## Context

- **Visuals:**  
  - Locked custom-audience detail visual: `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-fe833935-8de0-4af3-8d81-7c038d9bd677.png`  
  - Additional shaping visuals available from the same assets set used in this session.
- **References:**  
  - Current persona/custom audience UI: [components/client/project-detail/persona-drawer.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/persona-drawer.tsx)  
  - Client chat state + payload assembly: [app/client/projects/[id]/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/client/projects/[id]/page.tsx)  
  - Webhook/persist integration: [hooks/useChatQuestion.ts](/Users/royalnashef/Desktop/smart-arse/hooks/useChatQuestion.ts), [app/api/chat/persist/route.ts](/Users/royalnashef/Desktop/smart-arse/app/api/chat/persist/route.ts)  
  - History surfaces: [components/client/project-detail/chat-history-card.tsx](/Users/royalnashef/Desktop/smart-arse/components/client/project-detail/chat-history-card.tsx), [components/chat/chat-sidebar.tsx](/Users/royalnashef/Desktop/smart-arse/components/chat/chat-sidebar.tsx), [app/(dashboard)/projects/[id]/page.tsx](/Users/royalnashef/Desktop/smart-arse/app/(dashboard)/projects/[id]/page.tsx)  
  - Handover bundle contract: [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/README.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/README.md), [agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/WEBHOOK-CONTRACT.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/notes-archive/disrupt-mvp-frontend-handover_may-7-26/WEBHOOK-CONTRACT.md)
- **Product alignment:**  
  - Aligns with MVP AI chat integration and history polish in [agent-os/product/roadmap.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/roadmap.md).  
  - Supports project-centric context-aware chat behavior in [agent-os/product/mission.md](/Users/royalnashef/Desktop/smart-arse/agent-os/product/mission.md).

## Standards Applied

- `global/project-conventions` - preserve naming/import/class conventions while extending existing feature modules.
- `global/domain-data-layer` - extend shared domain/history types and plan matching DB migrations for new audience metadata.
- `css/ui-styling` - keep component layering/tokens consistent with current app visual language.
- `global/developer-guide` - keep chat/audience payload behavior compatible with n8n + Supabase integration expectations.

## Out of Scope

- Full digital twin feature work.
- Full focus group feature work.
- Citation-system rewrites (only regression-safety for touched chat flows).
