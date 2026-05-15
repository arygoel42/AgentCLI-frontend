"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

type CopyMarkdownProps = {
  rawUrl: string
}

export function CopyMarkdown({ rawUrl }: CopyMarkdownProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  async function copy() {
    setError(false)
    try {
      const res = await fetch(rawUrl)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[copy-markdown]", err)
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition-colors"
      title="Copy these docs as markdown — useful for pasting into an LLM"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" style={{ color: "var(--green)" }} />
          <span style={{ color: "var(--green)" }}>Copied</span>
        </>
      ) : error ? (
        <>
          <Copy className="w-3 h-3 text-red-400" />
          <span className="text-red-400">Failed</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Copy as markdown
        </>
      )}
    </button>
  )
}
