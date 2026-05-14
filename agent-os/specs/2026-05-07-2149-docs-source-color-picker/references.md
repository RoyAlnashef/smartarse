# References for Docs Source Color Picker

## Similar Implementations

### Project documents table dialogs

- **Location:** `components/upload/sortable-project-documents-table.tsx`
- **Relevance:** Contains current "Source color" dialog, swatch token interactions, and save/default behavior.
- **Key patterns:** shadcn `Dialog` shell, row action menu entry, local target state + async save callbacks.

### Project detail page integration

- **Location:** `app/(dashboard)/projects/[id]/page.tsx`
- **Relevance:** Hosts and wires document table callbacks to Supabase update functions.
- **Key patterns:** docs tab ownership, callback plumbing, toast/error behavior.

## Visual references

- Target style: `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-ba03740f-bbcf-47a7-9d3d-9a879850a009.png`
- Current baseline modal: `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-ba8fbe09-6642-474c-bce7-550e5a03d04e.png`
- In-app context: `/Users/royalnashef/.cursor/projects/Users-royalnashef-Desktop-smart-arse/assets/image-78346f59-2af9-430a-8613-88ca8a49465e.png`
