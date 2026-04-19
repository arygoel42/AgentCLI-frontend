"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface Line {
  type: "input" | "output" | "comment"
  text: string
  delay?: number
}

interface Props {
  lines: Line[]
  autoPlay?: boolean
  className?: string
}

export function InteractiveTerminal({ lines, autoPlay = true, className }: Props) {
  const [visibleLines, setVisibleLines] = useState<Line[]>([])
  const [typingIndex, setTypingIndex] = useState(0)
  const [typedText, setTypedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [done, setDone] = useState(false)
  // Ref to the scrollable body — NOT to a div inside it
  const scrollRef = useRef<HTMLDivElement>(null)

  function reset() {
    setVisibleLines([])
    setTypingIndex(0)
    setTypedText("")
    setDone(false)
    setIsPlaying(true)
  }

  useEffect(() => {
    if (autoPlay) setIsPlaying(true)
  }, [autoPlay])

  useEffect(() => {
    if (!isPlaying || typingIndex >= lines.length) {
      if (typingIndex >= lines.length) setDone(true)
      return
    }

    const line = lines[typingIndex]
    const delay = line.delay ?? (typingIndex === 0 ? 400 : 200)

    if (line.type === "output" || line.type === "comment") {
      const timer = setTimeout(() => {
        setVisibleLines(prev => [...prev, line])
        setTypingIndex(prev => prev + 1)
      }, delay)
      return () => clearTimeout(timer)
    }

    if (typedText.length < line.text.length) {
      const timer = setTimeout(() => {
        setTypedText(line.text.slice(0, typedText.length + 1))
      }, 35)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setVisibleLines(prev => [...prev, { ...line, text: typedText }])
        setTypedText("")
        setTypingIndex(prev => prev + 1)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, typingIndex, typedText, lines])

  // Scroll the terminal body itself — never touches window scroll
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [visibleLines, typedText])

  const currentLine = lines[typingIndex]

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--green)", opacity: 0.7 }} />
        <span className="ml-2 text-xs text-zinc-500 font-mono">petl</span>
        {done && (
          <button onClick={reset} className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ↺ replay
          </button>
        )}
      </div>

      {/* scrollRef is on the container itself */}
      <div ref={scrollRef} className="bg-zinc-950 p-4 min-h-[180px] max-h-[360px] overflow-y-auto font-mono text-xs leading-relaxed">
        {visibleLines.map((line, i) => (
          <div key={i} className="mb-1">
            {line.type === "comment" ? (
              <span className="text-zinc-600">{line.text}</span>
            ) : line.type === "input" ? (
              <span>
                <span style={{ color: "var(--green)" }}>❯ </span>
                <span className="text-zinc-200">{line.text}</span>
              </span>
            ) : (
              <span className="text-zinc-400 whitespace-pre-wrap">{line.text}</span>
            )}
          </div>
        ))}

        {isPlaying && !done && currentLine?.type === "input" && (
          <div>
            <span style={{ color: "var(--green)" }}>❯ </span>
            <span className="text-zinc-200">{typedText}</span>
            <span className="inline-block w-2 h-3.5 bg-zinc-200 ml-0.5 animate-pulse align-text-bottom" />
          </div>
        )}

        {!isPlaying && !done && (
          <button onClick={() => setIsPlaying(true)} className="text-zinc-500 hover:text-zinc-300 transition-colors mt-2">
            ▶ run demo
          </button>
        )}
      </div>
    </div>
  )
}
