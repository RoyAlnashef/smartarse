export type LegalTableColumn = {
  key: string
  header: string
}

export type LegalTableRow = Record<string, string>

export type LegalSection = {
  title: string
  paragraphs?: string[]
  listItems?: string[]
  subsections?: {
    title: string
    paragraphs?: string[]
    listItems?: string[]
  }[]
}

export type LegalDocument = {
  title: string
  subtitle?: string
  intro?: string[]
  documentControl?: { version: string; date: string }
  sections: LegalSection[]
  table?: {
    title: string
    columns: LegalTableColumn[]
    rows: LegalTableRow[]
    footnotes?: string[]
  }
}
