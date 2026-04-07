"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { getApiErrorMessage } from "@/lib/http"
import { getTheoryPdfData } from "@/lib/theory"

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"

type PdfViewerProps = {
  moduleId: number
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

type ProgressSnapshot = {
  lastPage: number
  percentageCompleted: number
  scrollPosition: number
}

const MIN_PROGRESS_DELTA = 2
const MIN_SCROLL_DELTA = 64

export const PdfViewer = memo(function PdfViewer({
  moduleId,
  initialPage,
  initialScrollPosition = 0,
  onCurrentPageChange,
  onPageCountChange,
  onProgressChange,
  theme,
  zoom,
}: PdfViewerProps) {
  const resolvedInitialPage = initialPage && initialPage > 0 ? initialPage : 1
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Array<HTMLDivElement | null>>([])
  const hasRestoredPositionRef = useRef(false)
  const currentPageRef = useRef(resolvedInitialPage)
  const initialPageRef = useRef(resolvedInitialPage)
  const initialScrollPositionRef = useRef(initialScrollPosition)
  const onCurrentPageChangeRef = useRef(onCurrentPageChange)
  const onPageCountChangeRef = useRef(onPageCountChange)
  const onProgressChangeRef = useRef(onProgressChange)
  const progressFrameRef = useRef<number | null>(null)
  const lastProgressRef = useRef<ProgressSnapshot>({
    lastPage: resolvedInitialPage,
    percentageCompleted: Number.NaN,
    scrollPosition: Number.NaN,
  })
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [containerWidth, setContainerWidth] = useState(920)
  const [fileLoading, setFileLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadPdf = async () => {
      try {
        setFileLoading(true)
        setError("")
        setPdfData(null)
        const data = await getTheoryPdfData(moduleId)
        if (!cancelled) {
          setPdfData(data)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError))
        }
      } finally {
        if (!cancelled) {
          setFileLoading(false)
        }
      }
    }

    void loadPdf()

    return () => {
      cancelled = true
    }
  }, [moduleId])

  useEffect(() => {
    onCurrentPageChangeRef.current = onCurrentPageChange
  }, [onCurrentPageChange])

  useEffect(() => {
    onPageCountChangeRef.current = onPageCountChange
  }, [onPageCountChange])

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange
  }, [onProgressChange])

  const scheduleProgressUpdate = useCallback(() => {
    if (progressFrameRef.current !== null) {
      return
    }

    progressFrameRef.current = window.requestAnimationFrame(() => {
      progressFrameRef.current = null

      const node = containerRef.current
      if (!node) {
        return
      }

      const scrollPosition = Math.round(node.scrollTop)
      const scrollHeight = node.scrollHeight - node.clientHeight
      const percentageCompleted =
        scrollHeight > 0 ? Math.min(100, (scrollPosition / scrollHeight) * 100) : 0
      const roundedPercentage = Math.round(percentageCompleted * 10) / 10
      const nextProgress = {
        lastPage: currentPageRef.current,
        percentageCompleted: roundedPercentage,
        scrollPosition,
      }
      const previousProgress = lastProgressRef.current
      const isFirstUpdate = Number.isNaN(previousProgress.percentageCompleted)
      const pageChanged = nextProgress.lastPage !== previousProgress.lastPage
      const percentageChanged =
        Math.abs(nextProgress.percentageCompleted - previousProgress.percentageCompleted) >=
        MIN_PROGRESS_DELTA
      const scrollChanged =
        Math.abs(nextProgress.scrollPosition - previousProgress.scrollPosition) >= MIN_SCROLL_DELTA
      const reachedBoundary =
        nextProgress.percentageCompleted === 0 || nextProgress.percentageCompleted === 100

      if (
        !isFirstUpdate &&
        !pageChanged &&
        !percentageChanged &&
        !scrollChanged &&
        !reachedBoundary
      ) {
        return
      }

      if (
        !isFirstUpdate &&
        nextProgress.lastPage === previousProgress.lastPage &&
        nextProgress.percentageCompleted === previousProgress.percentageCompleted &&
        nextProgress.scrollPosition === previousProgress.scrollPosition
      ) {
        return
      }

      lastProgressRef.current = nextProgress
      onProgressChangeRef.current(nextProgress)
    })
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = Math.max(320, Math.round((entries[0]?.contentRect.width || 920) - 32))
      setContainerWidth((current) => (current === width ? current : width))
    })

    resizeObserver.observe(node)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const handleScroll = () => scheduleProgressUpdate()

    scheduleProgressUpdate()
    node.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      node.removeEventListener("scroll", handleScroll)

      if (progressFrameRef.current !== null) {
        window.cancelAnimationFrame(progressFrameRef.current)
        progressFrameRef.current = null
      }
    }
  }, [scheduleProgressUpdate])

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
        if (nextPage === currentPageRef.current) {
          return
        }

        currentPageRef.current = nextPage
        onCurrentPageChangeRef.current(nextPage)
        scheduleProgressUpdate()
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
  }, [numPages, scheduleProgressUpdate])

  useEffect(() => {
    const node = containerRef.current
    if (!node || hasRestoredPositionRef.current || numPages === 0) {
      return
    }

    if (initialScrollPositionRef.current > 0) {
      node.scrollTo({ top: initialScrollPositionRef.current, behavior: "auto" })
      hasRestoredPositionRef.current = true
      scheduleProgressUpdate()
      return
    }

    const target = pageRefs.current[initialPageRef.current - 1]
    if (target) {
      target.scrollIntoView({ block: "start" })
    }

    hasRestoredPositionRef.current = true
    scheduleProgressUpdate()
  }, [numPages, scheduleProgressUpdate])

  const pageWidth = useMemo(
    () => Math.max(320, Math.round(containerWidth * zoom)),
    [containerWidth, zoom],
  )
  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages],
  )

  if (error) {
    return (
      <div className="rounded-[30px] border border-rose-500/20 bg-rose-500/10 px-6 py-20 text-center text-rose-100">
        {error}
      </div>
    )
  }

  if (fileLoading || !pdfData) {
    return (
      <div className="rounded-[30px] border border-white/10 bg-[rgba(7,5,13,0.82)] px-6 py-20 text-center text-slate-400">
        Loading PDF...
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
        file={{ data: pdfData }}
        loading={<div className="py-20 text-center text-slate-400">Loading PDF...</div>}
        onLoadSuccess={({ numPages: totalPages }) => {
          setError("")
          setNumPages((current) => (current === totalPages ? current : totalPages))
          onPageCountChangeRef.current(totalPages)
          scheduleProgressUpdate()
        }}
        onLoadError={(loadError) => {
          console.error("PDF load error:", loadError)
          setError(getApiErrorMessage(loadError))
        }}
      >
        <div className="space-y-6">
          {pageNumbers.map((pageNumber, index) => (
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
                  loading={<div className="p-10 text-center text-slate-400">Loading page...</div>}
                />
              </div>
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
})

PdfViewer.displayName = "PdfViewer"
