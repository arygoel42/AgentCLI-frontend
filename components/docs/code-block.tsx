"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  code: string
  language?: string
  filename?: string
  className?: string
}

export function CodeBlock({ code, language = "bash", filename, className }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <span className="text-xs text-muted-foreground font-mono">{filename}</span>
          <span className="text-xs text-muted-foreground">{language}</span>
        </div>
      )}
      <div className="relative group bg-[#0d0d0d]">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-zinc-300 scrollbar-thin">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

interface TabsProps {
  tabs: { label: string; code: string; language?: string }[]
  className?: string
}

export function CodeTabs({ tabs, className }: TabsProps) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(tabs[active].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between bg-muted/50 border-b border-border px-1">
        <div className="flex">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2.5 text-xs font-medium transition-colors",
                active === i
                  ? "text-foreground border-b-2 border-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="mr-3 p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="bg-[#0d0d0d]">
        <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-zinc-300">
          <code>{tabs[active].code}</code>
        </pre>
      </div>
    </div>
  )
}
