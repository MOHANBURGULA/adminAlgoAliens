"use client"

import dynamic from "next/dynamic"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-[#0B0518] text-sm text-gray-400">
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
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B0518]">
      <MonacoEditor
        height={height}
        language={language}
        theme="vs-dark"
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
