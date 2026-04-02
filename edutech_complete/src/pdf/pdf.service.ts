import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { PDFParse } from 'pdf-parse'
import { PdfBlock, PdfSection, PdfStructuredContent } from './pdf.types'

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name)

  async parsePdfBuffer(buffer: Buffer, fallbackTitle: string): Promise<PdfStructuredContent> {
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
    })
    const parsed = await parser.getText()
    await parser.destroy()
    const text = this.normalizeText(parsed.text || '')
    const title = fallbackTitle.trim() || 'Learning Document'
    const pageCount = parsed.total || 1
    const sections = this.extractSections(text, title, pageCount)

    return {
      title,
      pageCount,
      wordCount: this.countWords(text),
      sectionCount: sections.length,
      sections,
    }
  }

  private extractSections(rawText: string, fallbackTitle: string, pageCount: number) {
    const pages = this.splitIntoPages(rawText, pageCount)

    if (pages.length === 0) {
      return [
        this.createSection({
          index: 1,
          pageStart: 1,
          title: fallbackTitle,
          blocks: [
            {
              type: 'paragraph',
              text: 'No readable text could be extracted from this PDF.',
            },
          ],
        }),
      ]
    }

    const sections: PdfSection[] = []
    let sectionIndex = 1
    let currentTitle = fallbackTitle
    let currentPageStart = 1
    let paragraphBuffer: string[] = []
    let bulletBuffer: string[] = []
    let currentBlocks: PdfBlock[] = []

    const flushParagraph = () => {
      if (paragraphBuffer.length === 0) {
        return
      }

      currentBlocks.push({
        type: 'paragraph',
        text: paragraphBuffer.join(' ').trim(),
      })
      paragraphBuffer = []
    }

    const flushBullets = () => {
      if (bulletBuffer.length === 0) {
        return
      }

      currentBlocks.push({
        type: 'bullet-list',
        items: [...bulletBuffer],
      })
      bulletBuffer = []
    }

    const flushSection = () => {
      flushParagraph()
      flushBullets()

      if (currentBlocks.length === 0 && sections.length > 0) {
        currentBlocks = []
        return
      }

      sections.push(
        this.createSection({
          index: sectionIndex,
          pageStart: currentPageStart,
          title: currentTitle,
          blocks: currentBlocks,
        }),
      )
      sectionIndex += 1
      currentBlocks = []
    }

    pages.forEach((pageText, pageIndex) => {
      const lines = pageText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      lines.forEach((line) => {
        if (this.isHeading(line)) {
          flushSection()
          currentTitle = line
          currentPageStart = pageIndex + 1
          return
        }

        if (this.isBullet(line)) {
          flushParagraph()
          bulletBuffer.push(line.replace(/^([-*•◦▪]|\d+[.)])\s+/, '').trim())
          return
        }

        flushBullets()
        paragraphBuffer.push(line)
      })
    })

    flushSection()

    if (sections.length === 1 && sections[0]?.title === fallbackTitle && pages.length > 1) {
      return pages
        .map((pageText, index) => pageText.trim())
        .filter(Boolean)
        .map((pageText, index) =>
          this.createSection({
            index: index + 1,
            pageStart: index + 1,
            title: `${fallbackTitle} - Page ${index + 1}`,
            blocks: [{ type: 'paragraph', text: pageText }],
          }),
        )
    }

    return sections
  }

  private splitIntoPages(rawText: string, pageCount: number) {
    const explicitPages = rawText
      .split(/\f+/)
      .map((page) => page.trim())
      .filter(Boolean)

    if (explicitPages.length > 0) {
      return explicitPages
    }

    if (!rawText.trim()) {
      return []
    }

    const paragraphs = rawText
      .split(/\n{2,}/)
      .map((entry) => entry.trim())
      .filter(Boolean)

    if (pageCount <= 1 || paragraphs.length <= pageCount) {
      return [paragraphs.join('\n\n') || rawText]
    }

    const chunkSize = Math.max(1, Math.ceil(paragraphs.length / pageCount))
    const pages: string[] = []

    for (let index = 0; index < paragraphs.length; index += chunkSize) {
      pages.push(paragraphs.slice(index, index + chunkSize).join('\n\n'))
    }

    return pages
  }

  private createSection({
    blocks,
    index,
    pageStart,
    title,
  }: {
    index: number
    pageStart: number
    title: string
    blocks: PdfBlock[]
  }): PdfSection {
    const safeTitle = title.trim() || `Section ${index}`

    return {
      id: `section-${index}`,
      title: safeTitle,
      anchor: this.slugify(safeTitle) || `section-${index}`,
      pageStart,
      blocks: blocks.length
        ? blocks
        : [
            {
              type: 'paragraph',
              text: 'Content unavailable for this section.',
            },
          ],
    }
  }

  private normalizeText(value: string) {
    return value
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/•/g, '\n• ')
      .trim()
  }

  private countWords(value: string) {
    return value
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean).length
  }

  private isBullet(line: string) {
    return /^([-*•◦▪]|\d+[.)])\s+/.test(line)
  }

  private isHeading(line: string) {
    const normalized = line.trim()
    if (!normalized || normalized.length > 90) {
      return false
    }

    if (/^(chapter|section|module|lesson)\s+\d+/i.test(normalized)) {
      return true
    }

    if (/^\d+(\.\d+)*\s+/.test(normalized)) {
      return true
    }

    const words = normalized.split(/\s+/)
    if (words.length > 10) {
      return false
    }

    const withoutTrailingPunctuation = !/[.!?;:]$/.test(normalized)
    const looksLikeTitleCase =
      words.length > 1 &&
      words.every((word) => /^[A-Z][A-Za-z0-9()/-]*$/.test(word))
    const looksLikeUppercase = /^[A-Z0-9\s()/-]+$/.test(normalized)

    return withoutTrailingPunctuation && (looksLikeTitleCase || looksLikeUppercase)
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
