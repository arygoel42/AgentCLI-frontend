"use client"

import { useEffect, useRef, useState } from "react"
import { Edit2, Eye, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { findSectionLines } from "@/lib/parse-yml"

type YamlPanelProps = {
  yml: string
  highlightKey: string | null
  onChange: (newYml: string) => void
}

export function YamlPanel({ yml, highlightKey, onChange }: YamlPanelProps) {
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState(yml)
  const firstHighlightRef = useRef<HTMLDivElement>(null)

  // Keep draft in sync when yml changes from form edits (only when not editing)
  useEffect(() => {
    if (!editMode) setDraft(yml)
  }, [yml, editMode])

  // Scroll to highlighted section when it changes (view mode only)
  useEffect(() => {
    if (!editMode && firstHighlightRef.current) {
      firstHighlightRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [highlightKey, editMode])

  function enterEdit() {
    setDraft(yml)
    setEditMode(true)
  }

  function commitEdit() {
    onChange(draft)
    setEditMode(false)
  }

  function cancelEdit() {
    setDraft(yml)
    setEditMode(false)
  }

  const { start, end } = highlightKey
    ? findSectionLines(yml, highlightKey)
    : { start: -1, end: -1 }

  const lines = yml.split("\n")

  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <span className="text-xs font-medium text-muted-foreground font-mono">clicreator.yml</span>
        <div className="flex items-center gap-1">
          {editMode ? (
            <>
              <button
                onClick={commitEdit}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium transition-colors"
                style={{ backgroundColor: "var(--green)", color: "#000" }}
              >
                <Check className="w-3 h-3" /> Done
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                <Eye className="w-3 h-3" /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={enterEdit}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="w-3 h-3" /> Edit YAML
            </button>
          )}
        </div>
      </div>

      {/* Edit mode — textarea fills remaining space */}
      {editMode && (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 font-mono text-[11px] p-4 bg-background outline-none resize-none leading-5 min-h-0"
          spellCheck={false}
          autoFocus
        />
      )}

      {/* View mode — per-line highlighted pre */}
      {!editMode && (
        <ScrollArea className="flex-1">
          <pre className="font-mono text-[11px] leading-5 py-3 select-text">
            {lines.map((line, i) => {
              const isHighlighted = start >= 0 && i >= start && i < end
              const isFirst = i === start
              return (
                <div
                  key={i}
                  ref={isFirst ? firstHighlightRef : undefined}
                  className="flex items-stretch"
                  style={
                    isHighlighted
                      ? { backgroundColor: "var(--green-glow)", borderLeft: "2px solid var(--green)" }
                      : { borderLeft: "2px solid transparent" }
                  }
                >
                  <span className="select-none text-muted-foreground/30 w-8 shrink-0 text-right pr-3 text-[10px] leading-5">
                    {i + 1}
                  </span>
                  <span className="pr-4 whitespace-pre">{line || " "}</span>
                </div>
              )
            })}
          </pre>
        </ScrollArea>
      )}
    </div>
  )
}
