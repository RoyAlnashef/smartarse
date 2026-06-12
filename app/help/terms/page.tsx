import { LegalDocumentPage } from "@/components/help/legal-document-page"
import {
  termsAndConditionsDocument,
  termsAndConditionsMeta,
} from "@/lib/legal/terms-and-conditions"

export default function PublicTermsPage() {
  return (
    <LegalDocumentPage
      document={termsAndConditionsDocument}
      lastUpdated={termsAndConditionsMeta.lastUpdated}
      version={termsAndConditionsMeta.version}
    />
  )
}
