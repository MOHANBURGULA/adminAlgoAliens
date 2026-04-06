"use client"

import dynamic from "next/dynamic"
import { useAppTheme } from "@/components/theme/ThemeProvider"
import { getMonacoTheme } from "@/lib/theme"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div
      className="flex min-h-[220px] items-center justify-center text-sm text-theme-muted"
      style={{
        background: "var(--bg-surface)",
        border: "var(--card-border)",
        borderRadius: "calc(var(--card-radius) + 1rem)",
      }}
    >
      Loading editor...
    </div>
  ),
  ssr: false,
})

type LazyMonacoEditorProps = {
  height?: number
  language: string
  onChange: (value: string) => void
  value: string
}

export function LazyMonacoEditor({
  height = 280,
  language,
  onChange,
  value,
}: LazyMonacoEditorProps) {
  const { theme } = useAppTheme()

  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "var(--card-border)",
        borderRadius: "calc(var(--card-radius) + 1rem)",
      }}
    >
      <MonacoEditor
        height={height}
        language={language}
        theme={getMonacoTheme(theme)}
        value={value}
        onChange={(nextValue) => onChange(nextValue || "")}
        options={{
          automaticLayout: true,
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
        }}
      />
    </div>
  )
}
