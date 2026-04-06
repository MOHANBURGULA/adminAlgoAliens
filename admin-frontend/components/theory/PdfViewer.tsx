"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

type PdfViewerProps = {
  fileUrl: string
  initialPage?: number | null
  initialScrollPosition?: number
  onCurrentPageChange: (page: number) => void
  onPageCountChange: (count: number) => void
  onProgressChange: (payload: {
    lastPage: number
    percentageCompleted: number
    scrollPosition: number
  }) => void
  theme: "dark" | "light"
  zoom: number
}

export function PdfViewer({
  fileUrl,
  initialPage,
  initialScrollPosition = 0,
  onCurrentPageChange,
  onPageCountChange,
  onProgressChange,
  theme,
  zoom,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Array<HTMLDivElement | null>>([])
  const hasRestoredPositionRef = useRef(false)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage && initialPage > 0 ? initialPage : 1)
  const [containerWidth, setContainerWidth] = useState(920)
  const [error, setError] = useState("")

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width || 920
      setContainerWidth(width - 32)
    })

    resizeObserver.observe(node)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const handleScroll = () => {
      const scrollTop = node.scrollTop
      const scrollHeight = node.scrollHeight - node.clientHeight
      const percentageCompleted =
        scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0

      onProgressChange({
        lastPage: currentPage,
        percentageCompleted,
        scrollPosition: scrollTop,
      })
    }

    handleScroll()
    node.addEventListener("scroll", handleScroll, { passive: true })

    return () => node.removeEventListener("scroll", handleScroll)
  }, [currentPage, onProgressChange])

  useEffect(() => {
    const node = containerRef.current
    if (!node || numPages === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (!visibleEntry) {
          return
        }

        const nextPage = Number((visibleEntry.target as HTMLElement).dataset.pageNumber || "1")
        setCurrentPage(nextPage)
        onCurrentPageChange(nextPage)
      },
      {
        root: node,
        threshold: [0.3, 0.5, 0.7],
      },
    )

    pageRefs.current.forEach((pageRef) => {
      if (pageRef) {
        observer.observe(pageRef)
      }
    })

    return () => observer.disconnect()
  }, [numPages, onCurrentPageChange])

  useEffect(() => {
    const node = containerRef.current
    if (!node || hasRestoredPositionRef.current || numPages === 0) {
      return
    }

    if (initialScrollPosition > 0) {
      node.scrollTo({ top: initialScrollPosition, behavior: "smooth" })
      hasRestoredPositionRef.current = true
      return
    }

    if (!initialPage) {
      return
    }

    const target = pageRefs.current[initialPage - 1]
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
      hasRestoredPositionRef.current = true
    }
  }, [initialPage, initialScrollPosition, numPages])

  const pageWidth = useMemo(
    () => Math.max(320, Math.round(containerWidth * zoom)),
    [containerWidth, zoom],
  )

  if (error) {
    return (
      <div className="rounded-[30px] border border-rose-500/20 bg-rose-500/10 px-6 py-20 text-center text-rose-100">
        {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={[
        "max-h-[calc(100vh-170px)] overflow-y-auto scroll-smooth rounded-[30px] border p-4 sm:p-6",
        theme === "dark"
          ? "border-white/10 bg-[rgba(7,5,13,0.82)]"
          : "border-slate-200 bg-white/90",
      ].join(" ")}
    >
      <Document
        file={fileUrl}
        loading={<div className="py-20 text-center text-slate-400">Loading PDF pages...</div>}
        onLoadSuccess={({ numPages: totalPages }) => {
          setError("")
          setNumPages(totalPages)
          onPageCountChange(totalPages)
        }}
        onLoadError={(loadError) => {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load this PDF resource.",
          )
        }}
      >
        <div className="space-y-6">
          {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber, index) => (
            <div
              key={pageNumber}
              ref={(node) => {
                pageRefs.current[index] = node
              }}
              data-page-number={pageNumber}
              className="flex justify-center"
            >
              <div
                className={[
                  "overflow-hidden rounded-[26px] border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
                  theme === "dark"
                    ? "border-white/10 bg-[#130D22]"
                    : "border-slate-200 bg-slate-50",
                ].join(" ")}
              >
                <Page
                  pageNumber={pageNumber}
                  renderAnnotationLayer
                  renderTextLayer
                  width={pageWidth}
                />
              </div>
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}
