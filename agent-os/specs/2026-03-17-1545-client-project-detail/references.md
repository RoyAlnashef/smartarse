# References — Client Project Detail

## Similar implementations

### Client projects list (theme + layout patterns)

- **Location:** `app/client/projects/page.tsx`
- **Relevance:** client theme tokens (`arse-*`), branding header spacing, responsive layout patterns
- **Key patterns to reuse:** card styling + typography choices used on the client area

### Client project card (card styling)

- **Location:** `components/client/client-project-card.tsx`
- **Relevance:** magenta/cyan borders, hover shadow motif, “overview of project” copy style

### Client shell chrome (header/footer)

- **Location:** `app/client/layout.tsx`, `components/client/client-shell-header.tsx`, `components/client/client-shell-footer.tsx`
- **Relevance:** auth redirect, credits bar, client-facing navigation chrome

### Admin project detail chat orchestration (mock chat logic)

- **Location:** `app/(dashboard)/projects/[id]/page.tsx`
- **Relevance:** seeded conversations/files, doc selection state, send + simulated response flow
- **Note:** we won’t bring over admin tabs or chat history UI; only reuse the state transition ideas.

### Chat primitives (UI building blocks)

- **Location:** `components/chat/chat-window.tsx`, `components/chat/chat-input.tsx`, `components/chat/document-selector.tsx`
- **Relevance:** message rendering, input behavior (Enter to send), document selector interactions

## Mock data + types

- **Types:** `lib/types.ts`
- **Mock seed:** `lib/mock-data.ts` (projects, uploaded files, seeded conversations/messages)

