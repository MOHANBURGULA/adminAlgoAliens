"use client"

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { estimateMarkdownReadingMinutes } from "@/lib/theory"

type MarkdownViewerProps = {
  fileUrl: string
  initialScrollPosition?: number
  onEstimatedReadingTimeChange: (minutes: number) => void
  onProgressChange: (payload: {
    lastPage: null
    percentageCompleted: number
    scrollPosition: number
  }) => void
  searchQuery: string
  theme: "dark" | "light"
  zoom: number
}

function highlightNode(node: ReactNode, query: string): ReactNode {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return node
  }

  if (typeof node === "string") {
    const matcher = new RegExp(`(${trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const normalizedQuery = trimmedQuery.toLowerCase()
    return node.split(matcher).map((part, index) =>
      part.toLowerCase() === normalizedQuery ? (
        <mark key={`${part}-${index}`} className="rounded bg-fuchsia-500/30 px-0.5 text-inherit">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => <span key={index}>{highlightNode(child, query)}</span>)
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return cloneElement(node, {
      children: highlightNode(node.props.children, query),
    })
  }

  return node
}

export function MarkdownViewer({
  fileUrl,
  initialScrollPosition = 0,
  onEstimatedReadingTimeChange,
  onProgressChange,
  searchQuery,
  theme,
  zoom,
}: MarkdownViewerProps) {
  const [markdown, setMarkdown] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hasRestoredPositionRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    const loadMarkdown = async () => {
      try {
        setLoading(true)
        const response = await fetch(fileUrl, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Unable to load markdown content (${response.status}).`)
        }
        const rawMarkdown = await response.text()
        setMarkdown(rawMarkdown)
        setError("")
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load markdown content.")
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadMarkdown()

    return () => controller.abort()
  }, [fileUrl])

  useEffect(() => {
    onEstimatedReadingTimeChange(estimateMarkdownReadingMinutes(markdown))
  }, [markdown, onEstimatedReadingTimeChange])

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
        lastPage: null,
        percentageCompleted,
        scrollPosition: scrollTop,
      })
    }

    handleScroll()
    node.addEventListener("scroll", handleScroll, { passive: true })

    return () => node.removeEventListener("scroll", handleScroll)
  }, [onProgressChange])

  useEffect(() => {
    const node = containerRef.current
    if (!node || hasRestoredPositionRef.current || loading) {
      return
    }

    node.scrollTo({ top: initialScrollPosition, behavior: "smooth" })
    hasRestoredPositionRef.current = true
  }, [initialScrollPosition, loading])

  const proseClassName = useMemo(
    () =>
      [
        "prose prose-lg max-w-none",
        theme === "dark"
          ? "prose-invert prose-headings:text-white prose-p:text-slate-200 prose-strong:text-white prose-a:text-fuchsia-300 prose-blockquote:border-fuchsia-500/50 prose-blockquote:text-slate-300 prose-code:text-fuchsia-200 prose-li:text-slate-200 prose-th:text-white prose-td:text-slate-200"
          : "prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-indigo-600 prose-blockquote:border-indigo-300 prose-code:text-indigo-700 prose-li:text-slate-700 prose-th:text-slate-900 prose-td:text-slate-700",
      ].join(" "),
    [theme],
  )

  if (loading) {
    return (
      <div className="rounded-[30px] border border-white/10 bg-[rgba(7,5,13,0.82)] px-6 py-20 text-center text-slate-400">
        Loading markdown theory...
      </div>
    )
  }

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
        "max-h-[calc(100vh-170px)] overflow-y-auto scroll-smooth rounded-[30px] border p-6 sm:p-10",
        theme === "dark"
          ? "border-white/10 bg-[rgba(7,5,13,0.82)]"
          : "border-slate-200 bg-white/90",
      ].join(" ")}
    >
      <article className={proseClassName} style={{ fontSize: `${zoom}rem` }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code(props) {
              const { children, className, ...rest } = props
              const match = /language-(\w+)/.exec(className || "")
              const code = String(children).replace(/\n$/, "")

              if (!match) {
                return (
                  <code
                    className={[
                      "rounded-md px-1.5 py-0.5",
                      theme === "dark" ? "bg-white/10 text-fuchsia-200" : "bg-slate-100 text-indigo-700",
                    ].join(" ")}
                    {...rest}
                  >
                    {children}
                  </code>
                )
              }

              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={theme === "dark" ? oneDark : oneLight}
                  customStyle={{ borderRadius: "18px", padding: "1rem" }}
                  PreTag="div"
                >
                  {code}
                </SyntaxHighlighter>
              )
            },
            table({ children }) {
              return (
                <div className="my-6 overflow-x-auto rounded-2xl border border-white/10">
                  <table>{children}</table>
                </div>
              )
            },
            p({ children }) {
              return <p>{highlightNode(children, searchQuery)}</p>
            },
            li({ children }) {
              return <li>{highlightNode(children, searchQuery)}</li>
            },
            blockquote({ children }) {
              return <blockquote>{highlightNode(children, searchQuery)}</blockquote>
            },
            h1({ children }) {
              return <h1>{highlightNode(children, searchQuery)}</h1>
            },
            h2({ children }) {
              return <h2>{highlightNode(children, searchQuery)}</h2>
            },
            h3({ children }) {
              return <h3>{highlightNode(children, searchQuery)}</h3>
            },
            h4({ children }) {
              return <h4>{highlightNode(children, searchQuery)}</h4>
            },
            h5({ children }) {
              return <h5>{highlightNode(children, searchQuery)}</h5>
            },
            h6({ children }) {
              return <h6>{highlightNode(children, searchQuery)}</h6>
            },
            td({ children }) {
              return <td>{highlightNode(children, searchQuery)}</td>
            },
            th({ children }) {
              return <th>{highlightNode(children, searchQuery)}</th>
            },
            a({ children, href }) {
              return (
                <a href={href} target="_blank" rel="noreferrer">
                  {highlightNode(Children.toArray(children), searchQuery)}
                </a>
              )
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  )
}
