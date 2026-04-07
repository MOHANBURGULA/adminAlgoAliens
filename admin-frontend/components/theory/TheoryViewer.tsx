"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { getStoredUser } from "@/lib/auth"
import { getApiErrorMessage } from "@/lib/http"
import {
  estimatePdfReadingMinutes,
  getTheoryProgress,
  getTheoryResource,
  saveTheoryProgress,
  type TheoryProgress,
  type TheoryResource,
} from "@/lib/theory"
import { MarkdownViewer } from "./MarkdownViewer"
import { PdfViewer } from "./PdfViewer"
import { ReaderToolbar } from "./ReaderToolbar"
import { ReadingProgressBar } from "./ReadingProgressBar"

type TheoryViewerProps = {
  moduleId: number
}

function createProgressSnapshot(
  moduleId: number,
  progress: Pick<TheoryProgress, "percentageCompleted" | "scrollPosition" | "lastPage">,
) {
  return JSON.stringify({
    moduleId,
    percentageCompleted: Math.round(progress.percentageCompleted),
    scrollPosition: Math.round(progress.scrollPosition),
    lastPage: progress.lastPage,
  })
}

const DEFAULT_PROGRESS: TheoryProgress = {
  moduleId: 0,
  userId: 0,
  scrollPosition: 0,
  percentageCompleted: 0,
  lastPage: null,
  bookmarkPage: null,
  bookmarkScrollPosition: null,
  completed: false,
}

export function TheoryViewer({ moduleId }: TheoryViewerProps) {
  const router = useRouter()
  const fullscreenRef = useRef<HTMLDivElement | null>(null)
  const autosaveReadyRef = useRef(false)
  const lastSavedSnapshotRef = useRef("")

  const [resource, setResource] = useState<TheoryResource | null>(null)
  const [progress, setProgress] = useState<TheoryProgress>({
    ...DEFAULT_PROGRESS,
    moduleId,
  })
  const [viewerInitialProgress, setViewerInitialProgress] = useState({
    lastPage: null as number | null,
    scrollPosition: 0,
  })
  const [authResolved, setAuthResolved] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [estimatedReadingTime, setEstimatedReadingTime] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setUserId(getStoredUser()?.id ?? null)
    setAuthResolved(true)

    const storedTheme = window.localStorage.getItem("theory-reader-theme")
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const loadTheory = useCallback(async () => {
    try {
      setLoading(true)
      autosaveReadyRef.current = false
      lastSavedSnapshotRef.current = ""

      const theoryResource = await getTheoryResource(moduleId)
      setResource(theoryResource)

      let nextProgress: TheoryProgress

      if (userId) {
        const savedProgress = await getTheoryProgress(moduleId, userId)
        if (savedProgress) {
          nextProgress = savedProgress
          setCurrentPage(savedProgress.lastPage || 1)
        } else {
          nextProgress = {
            ...DEFAULT_PROGRESS,
            moduleId,
            userId,
          }
          setCurrentPage(1)
        }
      } else {
        nextProgress = {
          ...DEFAULT_PROGRESS,
          moduleId,
        }
      }

      setProgress(nextProgress)
      setViewerInitialProgress({
        lastPage: nextProgress.lastPage,
        scrollPosition: nextProgress.scrollPosition,
      })
      lastSavedSnapshotRef.current = createProgressSnapshot(moduleId, nextProgress)
      setError("")
      autosaveReadyRef.current = true
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [moduleId, userId])

  useEffect(() => {
    if (!authResolved) {
      return
    }

    if (!userId) {
      setLoading(false)
      setError("Sign in to continue reading this theory resource.")
      return
    }

    void loadTheory()
  }, [authResolved, loadTheory, userId])

  useEffect(() => {
    window.localStorage.setItem("theory-reader-theme", theme)
  }, [theme])

  useEffect(() => {
    if (resource?.fileType === "pdf" && pageCount > 0) {
      setEstimatedReadingTime(estimatePdfReadingMinutes(pageCount))
    }
  }, [pageCount, resource?.fileType])

  useEffect(() => {
    if (!autosaveReadyRef.current || !userId) {
      return
    }

    const snapshot = createProgressSnapshot(moduleId, {
      lastPage: progress.lastPage,
      percentageCompleted: progress.percentageCompleted,
      scrollPosition: progress.scrollPosition,
    })

    if (snapshot === lastSavedSnapshotRef.current) {
      return
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        await saveTheoryProgress({
          moduleId,
          percentageCompleted: progress.percentageCompleted,
          scrollPosition: progress.scrollPosition,
          lastPage: progress.lastPage,
        })
        lastSavedSnapshotRef.current = snapshot
      } catch {
        // Silent autosave retry on the next scroll update.
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [moduleId, progress.lastPage, progress.percentageCompleted, progress.scrollPosition, userId])

  const currentPageLabel = useMemo(() => {
    if (resource?.fileType === "pdf") {
      return `Page ${currentPage} of ${pageCount || 1}`
    }

    return "Markdown reader"
  }, [currentPage, pageCount, resource?.fileType])

  const canMarkCompleted = progress.percentageCompleted >= 90 || Boolean(progress.completed)

  const handlePdfCurrentPageChange = useCallback((page: number) => {
    setCurrentPage((current) => (current === page ? current : page))
  }, [])

  const handlePdfPageCountChange = useCallback((count: number) => {
    setPageCount((current) => (current === count ? current : count))
  }, [])

  const handleEstimatedReadingTimeChange = useCallback((minutes: number) => {
    setEstimatedReadingTime((current) => (current === minutes ? current : minutes))
  }, [])

  const handlePdfProgressChange = useCallback(
    ({
      lastPage,
      percentageCompleted,
      scrollPosition,
    }: {
      lastPage: number
      percentageCompleted: number
      scrollPosition: number
    }) => {
      setProgress((current) => {
        if (
          current.lastPage === lastPage &&
          current.percentageCompleted === percentageCompleted &&
          current.scrollPosition === scrollPosition
        ) {
          return current
        }

        return {
          ...current,
          lastPage,
          percentageCompleted,
          scrollPosition,
        }
      })
    },
    [],
  )

  const handleMarkdownProgressChange = useCallback(
    ({
      percentageCompleted,
      scrollPosition,
    }: {
      lastPage: null
      percentageCompleted: number
      scrollPosition: number
    }) => {
      setProgress((current) => {
        if (
          current.lastPage === null &&
          current.percentageCompleted === percentageCompleted &&
          current.scrollPosition === scrollPosition
        ) {
          return current
        }

        return {
          ...current,
          lastPage: null,
          percentageCompleted,
          scrollPosition,
        }
      })
    },
    [],
  )

  const handleBookmark = async () => {
    if (!userId) {
      return
    }

    try {
      const savedProgress = await saveTheoryProgress({
        moduleId,
        bookmarkPage: progress.lastPage,
        bookmarkScrollPosition: progress.scrollPosition,
        lastPage: progress.lastPage,
        percentageCompleted: progress.percentageCompleted,
        scrollPosition: progress.scrollPosition,
      })

      setProgress((current) => ({
        ...current,
        bookmarkPage: savedProgress.bookmarkPage ?? current.lastPage,
        bookmarkScrollPosition:
          savedProgress.bookmarkScrollPosition ?? current.scrollPosition,
      }))
      toast.success("Bookmark saved")
    } catch (bookmarkError) {
      toast.error(getApiErrorMessage(bookmarkError))
    }
  }

  const handleMarkCompleted = async () => {
    if (!userId) {
      return
    }

    try {
      const savedProgress = await saveTheoryProgress({
        moduleId,
        markCompleted: true,
        lastPage: progress.lastPage,
        percentageCompleted: Math.max(progress.percentageCompleted, 90),
        scrollPosition: progress.scrollPosition,
      })

      setProgress((current) => ({
        ...current,
        completed: true,
        percentageCompleted: Math.max(current.percentageCompleted, 100),
      }))

      toast.success(
        savedProgress.unlockedNextStage
          ? "Theory completed and next stage unlocked"
          : "Theory marked as completed",
      )
    } catch (completionError) {
      toast.error(getApiErrorMessage(completionError))
    }
  }

  const toggleFullscreen = async () => {
    const element = fullscreenRef.current
    if (!element) {
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await element.requestFullscreen()
  }

  if (loading) {
    return <div className="px-6 py-24 text-center text-slate-300">Loading theory reader...</div>
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">
        {error}
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-slate-300">
        No theory resource has been uploaded for this module yet.
      </div>
    )
  }

  return (
    <div
      ref={fullscreenRef}
      className={[
        "min-h-screen transition-colors duration-300",
        theme === "dark"
          ? "bg-[radial-gradient(circle_at_top,#24123c,transparent_30%),#030306] text-white"
          : "bg-[radial-gradient(circle_at_top,#e9ddff,transparent_25%),#f7f5fb] text-slate-900",
      ].join(" ")}
    >
      <ReadingProgressBar percentage={progress.percentageCompleted} theme={theme} />

      <ReaderToolbar
        canMarkCompleted={canMarkCompleted}
        completed={Boolean(progress.completed)}
        currentPageLabel={currentPageLabel}
        estimatedReadingTime={estimatedReadingTime}
        isFullscreen={isFullscreen}
        onBack={() => router.back()}
        onBookmark={() => void handleBookmark()}
        onMarkCompleted={() => void handleMarkCompleted()}
        onSearchChange={setSearchQuery}
        onToggleFullscreen={() => void toggleFullscreen()}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        onZoomIn={() => setZoom((current) => Math.min(2, Number((current + 0.1).toFixed(2))))}
        onZoomOut={() => setZoom((current) => Math.max(0.8, Number((current - 0.1).toFixed(2))))}
        progressPercentage={progress.percentageCompleted}
        searchEnabled={resource.fileType === "md"}
        searchQuery={searchQuery}
        theme={theme}
        title={resource.title}
        zoom={zoom}
      />

      <div className="mx-auto max-w-6xl px-3 pb-12 pt-4 sm:px-6">
        <div
          className={[
            "rounded-[34px] border p-4 backdrop-blur-xl sm:p-6",
            theme === "dark"
              ? "border-white/10 bg-white/[0.03]"
              : "border-slate-200 bg-white/60",
          ].join(" ")}
        >
          {resource.fileType === "pdf" ? (
            <PdfViewer
              key={`pdf-${moduleId}-${resource.fileUrl}`}
              moduleId={moduleId}
              initialPage={viewerInitialProgress.lastPage}
              initialScrollPosition={viewerInitialProgress.scrollPosition}
              onCurrentPageChange={handlePdfCurrentPageChange}
              onPageCountChange={handlePdfPageCountChange}
              onProgressChange={handlePdfProgressChange}
              theme={theme}
              zoom={zoom}
            />
          ) : (
            <MarkdownViewer
              key={`markdown-${moduleId}-${resource.fileUrl}`}
              moduleId={moduleId}
              initialScrollPosition={viewerInitialProgress.scrollPosition}
              onEstimatedReadingTimeChange={handleEstimatedReadingTimeChange}
              onProgressChange={handleMarkdownProgressChange}
              searchQuery={searchQuery}
              theme={theme}
              zoom={zoom}
            />
          )}
        </div>
      </div>
    </div>
  )
}
