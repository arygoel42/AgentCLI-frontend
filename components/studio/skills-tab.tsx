"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { toast } from "sonner"
import { BookOpen, Globe, Trash2, Save } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { saveSkills } from "@/app/dashboard/projects/[id]/actions"
import type { PreviewApi } from "@/lib/engine"

const SKILL_GLOBAL_KEY = "_global"

type SkillsTabProps = {
  cliId: string
  api: PreviewApi
  initialSkills: Record<string, string>
  // defaultSkills is the engine's auto-derived markdown, keyed by skill name.
  // Source of truth — same Go template path runs at build time. Always shown
  // read-only above the user's notes.
  defaultSkills: Record<string, string>
}

export function SkillsTab({ cliId, api, initialSkills, defaultSkills }: SkillsTabProps) {
  // skills holds only the user's notes (the appendix), keyed by skill name.
  // The full skill body the binary embeds is `defaultSkills[name] + notes`.
  const [skills, setSkills] = useState<Record<string, string>>(initialSkills)
  const [activeKey, setActiveKey] = useState<string>(SKILL_GLOBAL_KEY)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const lastSavedRef = useRef<string>(JSON.stringify(initialSkills))

  const items = useMemo(() => {
    const groupItems = api.groups.map((g) => ({
      key: g.name,
      label: g.name,
      sublabel: g.description || `${g.commands.length} command${g.commands.length === 1 ? "" : "s"}`,
      hasNotes: Boolean(skills[g.name]?.trim()),
    }))
    return [
      {
        key: SKILL_GLOBAL_KEY,
        label: "_global",
        sublabel: "Cross-cutting reference (auth, output, exit codes)",
        hasNotes: Boolean(skills[SKILL_GLOBAL_KEY]?.trim()),
      },
      ...groupItems,
    ]
  }, [api.groups, skills])

  const autoBody = defaultSkills[activeKey] ?? ""
  const notes = skills[activeKey] ?? ""
  const hasNotes = notes.trim().length > 0

  useEffect(() => {
    const serialized = JSON.stringify(skills)
    if (serialized === lastSavedRef.current) return
    setSaveStatus("saving")
    const timer = setTimeout(async () => {
      try {
        await saveSkills(cliId, skills)
        lastSavedRef.current = serialized
        setSaveStatus("saved")
      } catch (err) {
        console.error("[skills autosave] failed:", err)
        setSaveStatus("error")
        toast.error(err instanceof Error ? err.message : "Skill autosave failed")
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [skills, cliId])

  function updateNotes(next: string) {
    setSkills((prev) => {
      const copy = { ...prev }
      // Drop the key entirely when notes go empty so the DB stays a true diff.
      if (next.trim().length === 0) {
        delete copy[activeKey]
      } else {
        copy[activeKey] = next
      }
      return copy
    })
  }

  function clearNotes() {
    setSkills((prev) => {
      const copy = { ...prev }
      delete copy[activeKey]
      return copy
    })
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
      {/* Skill list */}
      <ResizablePanel defaultSize={28} minSize={20}>
        <div className="h-full flex flex-col bg-background">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              Skills
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              One file per group, baked into the binary. Auto-derived from your spec — add custom notes below.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {items.map((item) => {
              const active = activeKey === item.key
              const isGlobal = item.key === SKILL_GLOBAL_KEY
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveKey(item.key)}
                  className="w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/40"
                  style={
                    active
                      ? { backgroundColor: "var(--green-glow)", borderLeft: "2px solid var(--green)" }
                      : { borderLeft: "2px solid transparent" }
                  }
                >
                  {isGlobal ? (
                    <Globe className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--green)" }} />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{item.label}</span>
                      {item.hasNotes && (
                        <span
                          className="text-[9px] font-mono px-1 py-0.5 rounded uppercase"
                          style={{ backgroundColor: "var(--green-glow)", color: "var(--green)" }}
                          title="Has custom notes appended"
                        >
                          notes
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{item.sublabel}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="px-3 py-2 border-t border-border flex items-center justify-center text-[11px] text-muted-foreground">
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
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right: read-only auto preview (top) + editable Notes (bottom) */}
      <ResizablePanel defaultSize={72} minSize={40}>
        <ResizablePanelGroup direction="vertical">
          {/* Auto-generated preview */}
          <ResizablePanel defaultSize={62} minSize={20}>
            <div className="h-full flex flex-col bg-background">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-mono truncate">skills/{activeKey}.md</p>
                <p className="text-[10px] text-muted-foreground">
                  Auto-generated from your spec. Read-only — regenerated on every rebuild.
                </p>
              </div>
              <pre
                className="flex-1 overflow-auto font-mono text-xs px-4 py-3 leading-relaxed text-muted-foreground whitespace-pre-wrap"
                style={{ tabSize: 2 }}
              >
                {autoBody || "(no preview available — try refreshing)"}
              </pre>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Editable notes */}
          <ResizablePanel defaultSize={38} minSize={15}>
            <div className="h-full flex flex-col bg-background">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium">Your notes</p>
                  <p className="text-[10px] text-muted-foreground">
                    Appended to the auto content under <span className="font-mono">## Notes</span>. Tips, custom workflows,
                    or warnings — anything your agent should know about this group.
                  </p>
                </div>
                {hasNotes && (
                  <button
                    onClick={clearNotes}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded border border-border"
                    title="Discard your notes for this skill"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => updateNotes(e.target.value)}
                spellCheck={false}
                placeholder="Examples:&#10;  • Always confirm before calling delete in production.&#10;  • Pair list --jq with create to seed test data.&#10;  • Use --dry-run for any destructive call from automation."
                className="flex-1 resize-none font-mono text-xs px-4 py-3 bg-background outline-none border-0 leading-relaxed placeholder:text-muted-foreground/50"
                style={{ tabSize: 2 }}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
