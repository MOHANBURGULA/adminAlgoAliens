"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  LayoutPanelLeft,
  PanelsTopLeft,
} from "lucide-react"
import type { ModuleDocument, PdfSection } from "@/lib/learning"

type InteractivePdfViewerProps = {
  document: ModuleDocument
}

type ViewerMode = "scroll" | "carousel"

export function InteractivePdfViewer({ document }: InteractivePdfViewerProps) {
  const [mode, setMode] = useState<ViewerMode>("scroll")
  const [activeSectionId, setActiveSectionId] = useState(
    document.parsedContent?.sections[0]?.id || "",
  )
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const sections = useMemo(() => document.parsedContent?.sections || [], [document.parsedContent])

  const activeIndex = useMemo(
    () => Math.max(0, sections.findIndex((section) => section.id === activeSectionId)),
    [activeSectionId, sections],
  )

  useEffect(() => {
    if (sections.length === 0 || mode !== "scroll") {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting)
        if (visibleEntry?.target?.id) {
          setActiveSectionId(visibleEntry.target.id)
        }
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: 0.15,
      },
    )

    sections.forEach((section) => {
      const node = sectionRefs.current[section.id]
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [mode, sections])

  if (!document.parsedContent || sections.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-[#0B0518] p-5">
        <p className="text-sm text-gray-300">
          Interactive parsing is not available for this PDF yet.
        </p>
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
        >
          Open Original PDF
        </a>
      </div>
    )
  }

  const currentSection = sections[activeIndex] || sections[0]
  const progress = Math.round(((activeIndex + 1) / sections.length) * 100)

  const scrollToSection = (section: PdfSection) => {
    setActiveSectionId(section.id)
    sectionRefs.current[section.id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#12092A]/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-purple-200">
            Interactive Lesson
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{document.title}</h3>
          <p className="mt-2 text-sm text-gray-300">
            {document.parsedContent.sectionCount} sections •{" "}
            {document.parsedContent.pageCount} pages • {document.parsedContent.wordCount} words
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("scroll")}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition ${
              mode === "scroll"
                ? "border-purple-500/30 bg-purple-500/10 text-white"
                : "border-white/10 bg-white/[0.03] text-gray-300"
            }`}
          >
            <LayoutPanelLeft size={16} />
            Sidebar
          </button>
          <button
            type="button"
            onClick={() => setMode("carousel")}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition ${
              mode === "carousel"
                ? "border-purple-500/30 bg-purple-500/10 text-white"
                : "border-white/10 bg-white/[0.03] text-gray-300"
            }`}
          >
            <PanelsTopLeft size={16} />
            Carousel
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-gray-400">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {mode === "scroll" ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-white/10 bg-[#0B0518] p-3">
            <div className="space-y-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    activeSectionId === section.id
                      ? "bg-purple-500/15 text-white"
                      : "bg-transparent text-gray-300 hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
                    Section {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-medium">{section.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="max-h-[640px] space-y-4 overflow-y-auto rounded-[24px] border border-white/10 bg-[#0B0518] p-4">
            {sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                ref={(node) => {
                  sectionRefs.current[section.id] = node
                }}
                className="rounded-[24px] border border-white/10 bg-[#12092A] p-5"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                  Page {section.pageStart}
                </p>
                <h4 className="mt-2 text-2xl font-semibold text-white">{section.title}</h4>
                <div className="mt-4 space-y-4 text-sm leading-7 text-gray-200">
                  {section.blocks.map((block, index) =>
                    block.type === "paragraph" ? (
                      <p key={`${section.id}-paragraph-${index}`}>{block.text}</p>
                    ) : (
                      <ul
                        key={`${section.id}-list-${index}`}
                        className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={`${section.id}-item-${itemIndex}`} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0B0518] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                Section {activeIndex + 1} of {sections.length}
              </p>
              <h4 className="mt-2 text-2xl font-semibold text-white">{currentSection.title}</h4>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveSectionId(
                    sections[Math.max(0, activeIndex - 1)]?.id || currentSection.id,
                  )
                }
                disabled={activeIndex === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveSectionId(
                    sections[Math.min(sections.length - 1, activeIndex + 1)]?.id ||
                      currentSection.id,
                  )
                }
                disabled={activeIndex === sections.length - 1}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-[#12092A] p-5">
            <div className="space-y-4 text-sm leading-7 text-gray-200">
              {currentSection.blocks.map((block, index) =>
                block.type === "paragraph" ? (
                  <p key={`${currentSection.id}-paragraph-${index}`}>{block.text}</p>
                ) : (
                  <ul
                    key={`${currentSection.id}-list-${index}`}
                    className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    {block.items.map((item, itemIndex) => (
                      <li key={`${currentSection.id}-item-${itemIndex}`} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
        >
          Open Original PDF
        </a>
      </div>
    </section>
  )
}
