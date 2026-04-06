"use client"

import { ChevronDown, Lock, PlayCircle } from "lucide-react"
import { useState } from "react"
import type { CourseModulePreview } from "@/lib/course-catalog"
import { cn } from "@/lib/utils"

type CourseContentAccordionProps = {
  sections: CourseModulePreview[]
}

export default function CourseContentAccordion({
  sections,
}: CourseContentAccordionProps) {
  const [openSectionId, setOpenSectionId] = useState<number | null>(
    sections[0]?.id ?? null,
  )

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const open = openSectionId === section.id

        return (
          <div
            key={section.id}
            style={{
              border: "var(--card-border)",
              borderRadius: "calc(var(--card-radius) + 0.5rem)",
              background: "var(--panel-background)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setOpenSectionId((current) =>
                  current === section.id ? null : section.id,
                )
              }
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-theme-main">
                    {section.title}
                  </h3>
                  <span className="text-sm text-theme-muted">
                    {section.lessonCount} lessons / {section.totalDurationLabel}
                  </span>
                  {section.isLocked ? (
                    <span className="theme-chip px-3 py-1 text-xs font-medium">
                      Locked
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-theme-muted">
                  {section.summary}
                </p>
              </div>

              <ChevronDown
                size={18}
                className={cn(
                  "shrink-0 text-theme-muted transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </button>

            {open ? (
              <div className="space-y-3 px-5 pb-5">
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                    style={{
                      border: "var(--card-border)",
                      borderRadius: "calc(var(--card-radius) + 0.3rem)",
                      background: "var(--subsurface-background)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {lesson.isLocked ? (
                        <Lock size={16} className="text-theme-muted" />
                      ) : (
                        <PlayCircle
                          size={16}
                          className="text-[var(--accent-cyan)]"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-theme-main">
                          {lesson.title}
                        </p>
                        {lesson.isPreview ? (
                          <p className="text-xs text-theme-muted">
                            Free preview lesson
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-theme-muted">
                      <span>{lesson.durationLabel}</span>
                      {lesson.isPreview ? (
                        <span className="theme-chip theme-chip-secondary px-3 py-1 text-xs font-medium">
                          Preview
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
