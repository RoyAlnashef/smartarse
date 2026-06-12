import { LegalDocumentPage } from "@/components/help/legal-document-page"
import { privacySummaryDocument, privacySummaryMeta } from "@/lib/legal/privacy-summary"

export default function PublicPrivacyPage() {
  return (
    <LegalDocumentPage
      document={privacySummaryDocument}
      lastUpdated={privacySummaryMeta.lastUpdated}
      version={privacySummaryMeta.version}
    />
  )
}
