# References for Help pages (FAQ, Privacy, Contact)

## Similar Implementations

### Sign-in page footer links

- **Location:** `components/login-page.tsx`
- **Relevance:** This is where the footer links already point to `/help/faq` and `/help/privacy`. We will extend it to add “Contact the team” with the same new-tab behavior.
- **Key patterns:** Uses `next/link` and consistent typography classes for the footer.

### Client-user footer links

- **Location:** `components/client/client-shell-footer.tsx`
- **Relevance:** This footer mirrors sign-in footer links for authenticated client-user pages, including `/help/contact`. Links open in the same tab.
- **Key patterns:** Simple `Link` row layout with separators.

### Existing help page stubs

- **Location:** `app/help/faq/page.tsx`, `app/help/privacy/page.tsx`
- **Relevance:** These pages currently render basic placeholder content. We will update them to use a shared `app/help/layout.tsx` wrapper (header + consistent max-width/padding).
- **Key patterns:** Simple centered `max-w-2xl` typography for readability.

### Client shell header (visual reference)

- **Location:** `components/client/client-shell-header.tsx`
- **Relevance:** Used as a visual reference for the help header branding row.
- **Key patterns:** Brand typography and button styling tokens.

