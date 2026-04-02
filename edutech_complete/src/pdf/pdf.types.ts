export type PdfBlock =
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'bullet-list'
      items: string[]
    }

export type PdfSection = {
  id: string
  title: string
  anchor: string
  pageStart: number
  blocks: PdfBlock[]
}

export type PdfStructuredContent = {
  title: string
  pageCount: number
  wordCount: number
  sectionCount: number
  sections: PdfSection[]
}
