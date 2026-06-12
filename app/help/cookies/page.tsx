import { LegalDocumentPage } from "@/components/help/legal-document-page"
import { cookiePolicyDocument, cookiePolicyMeta } from "@/lib/legal/cookie-policy"

export default function PublicCookiesPage() {
  return (
    <LegalDocumentPage
      document={cookiePolicyDocument}
      lastUpdated={cookiePolicyMeta.lastUpdated}
      version={cookiePolicyMeta.version}
    />
  )
}
