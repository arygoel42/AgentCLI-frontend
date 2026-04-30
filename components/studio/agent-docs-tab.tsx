"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { BookOpen, Save, Trash2 } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { saveSkillNotes } from "@/app/dashboard/projects/[id]/actions"

type AgentDocsTabProps = {
  cliId: string
  initialNotes: string
  // llmsText is the engine-rendered llms.txt body — same Go template runs at
  // build time, so this read-only preview matches what gets embedded in the binary.
  llmsText: string
}

export function AgentDocsTab({ cliId, initialNotes, llmsText }: AgentDocsTabProps) {
  const [notes, setNotes] = useState<string>(initialNotes)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const lastSavedRef = useRef<string>(initialNotes)

  useEffect(() => {
    if (notes === lastSavedRef.current) return
    setSaveStatus("saving")
    const timer = setTimeout(async () => {
      try {
        await saveSkillNotes(cliId, notes)
        lastSavedRef.current = notes
        setSaveStatus("saved")
      } catch (err) {
        console.error("[skill notes autosave] failed:", err)
        setSaveStatus("error")
        toast.error(err instanceof Error ? err.message : "Notes autosave failed")
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [notes, cliId])

  const hasNotes = typeof notes == "string" && notes.trim().length > 0

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Header strip — auto-rendered llms.txt + user notes */}
      <div className="px-5 py-3 border-b border-border flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
             llms.txt
          </h3>
          <p className="text-[10px] text-muted-foreground">
              Auto-generated from your spec on every rebuild and ships with the CLI binary
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground shrink-0">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5">
              <Save className="w-3 h-3 animate-pulse" />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-green-500">
              <Save className="w-3 h-3" />
              Saved
            </span>
          )}
          {saveStatus === "error" && <span className="text-red-500">Save failed</span>}
          {saveStatus === "idle" && <span className="opacity-50">Notes save automatically</span>}
        </div>
      </div>

      {/* Vertical split: read-only preview top, editable notes bottom */}
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={62} minSize={20}>
          <div className="h-full flex flex-col bg-background">
            <pre
              className="flex-1 overflow-auto font-mono text-xs px-5 py-3 leading-relaxed text-muted-foreground whitespace-pre-wrap"
              style={{ tabSize: 2 }}
            >
              {llmsText || "(no preview available — try saving the project to refresh)"}
            </pre>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={38} minSize={15}>
          <div className="h-full flex flex-col bg-background">
            <div className="px-5 py-2 border-b border-border flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium">Your notes</p>
                <p className="text-[10px] text-muted-foreground">
                  Appended to the auto content under <span className="font-mono">## Notes</span> — tips,
                  custom workflows, or warnings agents using this CLI should know about.
                </p>
              </div>
              {hasNotes && (
                <button
                  onClick={() => setNotes("")}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded border border-border"
                  title="Clear all notes"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              spellCheck={false}
              placeholder="Examples:&#10;  • Always confirm before calling delete in production.&#10;  • Pair list --jq with create to seed test data.&#10;  • Use --dry-run for any destructive call from automation."
              className="flex-1 resize-none font-mono text-xs px-5 py-3 bg-background outline-none border-0 leading-relaxed placeholder:text-muted-foreground/50"
              style={{ tabSize: 2 }}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
