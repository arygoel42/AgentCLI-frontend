"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { ExternalLink, FileText, Save, RotateCcw } from "lucide-react"
import Link from "next/link"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { saveDocsMd } from "@/app/dashboard/projects/[id]/actions"
import { DocsPreview } from "@/components/docs/docs-preview"
import {
  buildDocsViewModel,
  parseDocsMd,
  serializeOverrides,
  slugify,
  DOCS_SECTIONS,
  type DocsOverrides,
  type DocsSectionId,
} from "@/lib/docs-render"
import type { UserDocs } from "@/lib/engine"

type DocsTabProps = {
  cliId: string
  cliName: string
  initialDocsMd: string
  userDocs: UserDocs
  repoOwner: string | null
  repoName: string | null
  docsPublished: boolean
}

const PLACEHOLDERS: Record<DocsSectionId, string> = {
  intro_md:
    "# What this CLI does\n\nA short overview your users see first. Mention the problem it solves and any prerequisites.",
  install_md:
    "Notes that go above the install snippets — package size, supported platforms, anything users should know before running the command.",
  demo_md:
    "Set up the demo: tell readers what they're about to see and what to watch for.",
  auth_md:
    "How to get credentials, where to store them, who to contact if a token doesn't work.",
  commands_md:
    "Anything readers should know before scanning the API reference — naming conventions, common flags, jq tips.",
}

export function DocsTab({
  cliId,
  cliName,
  initialDocsMd,
  userDocs,
  repoOwner,
  repoName,
  docsPublished,
}: DocsTabProps) {
  const [overrides, setOverrides] = useState<DocsOverrides>(() => parseDocsMd(initialDocsMd))
  const [activeSection, setActiveSection] = useState<DocsSectionId>("intro_md")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const lastSavedRef = useRef(initialDocsMd)

  useEffect(() => {
    const serialized = serializeOverrides(overrides)
    if (serialized === lastSavedRef.current) return
    setSaveStatus("saving")
    const timer = setTimeout(async () => {
      try {
        await saveDocsMd(cliId, serialized)
        lastSavedRef.current = serialized
        setSaveStatus("saved")
      } catch (err) {
        console.error("[docs autosave] failed:", err)
        setSaveStatus("error")
        toast.error(err instanceof Error ? err.message : "Docs autosave failed")
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [overrides, cliId])

  function setSection(id: DocsSectionId, value: string) {
    setOverrides((prev) => ({ ...prev, [id]: value }))
  }

  function resetSection(id: DocsSectionId) {
    setOverrides((prev) => ({ ...prev, [id]: "" }))
  }

  const docsCliName = userDocs.cli_name || cliName
  const slug = slugify(cliName)
  const viewModel = buildDocsViewModel({
    userDocs,
    docsMd: serializeOverrides(overrides),
    cliName: docsCliName,
    repoOwner,
    repoName,
    origin: typeof window !== "undefined" ? window.location.origin : null,
    slug,
  })

  const publicHref = `/docs/${slug}`
  const activeValue = overrides[activeSection]
  const activeFallback = viewModel.defaults[activeSection]
  const isOverridden = activeValue.trim().length > 0

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            User docs
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Each section is auto-generated from your spec. Override any section on the right — leave it blank to use the auto fallback.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {docsPublished && (
            <Link
              href={publicHref}
              target="_blank"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {publicHref}
            </Link>
          )}
          <div className="text-[11px] text-muted-foreground">
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
            {saveStatus === "idle" && <span className="opacity-50">Changes save automatically</span>}
          </div>
        </div>
      </div>

      {/* Split: preview left, tabbed editor right */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
        <ResizablePanel defaultSize={58} minSize={35}>
          <div className="h-full overflow-y-auto bg-background">
            <DocsPreview viewModel={viewModel} compact />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={42} minSize={25}>
          <div className="h-full flex flex-col bg-background">
            {/* Section tab strip */}
            <div className="border-b border-border flex items-center overflow-x-auto">
              {DOCS_SECTIONS.map((s) => {
                const active = activeSection === s.id
                const overridden = overrides[s.id].trim().length > 0
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className="shrink-0 px-3 py-2 text-xs flex items-center gap-1.5 transition-colors"
                    style={
                      active
                        ? { borderBottom: "2px solid var(--green)", color: "var(--foreground)", fontWeight: 500 }
                        : { borderBottom: "2px solid transparent", color: "var(--muted-foreground)" }
                    }
                  >
                    {s.label}
                    {overridden && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "var(--green)" }}
                        title="Section has a custom override"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Active section editor */}
            <div className="px-5 py-2 border-b border-border flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium">
                  {DOCS_SECTIONS.find((s) => s.id === activeSection)?.label} — markdown
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isOverridden
                    ? "Custom override. Live in the preview."
                    : "Using the auto fallback. Type to override."}
                </p>
              </div>
              {isOverridden && (
                <button
                  onClick={() => resetSection(activeSection)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border shrink-0"
                  title="Clear this override and use the auto fallback"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
            <textarea
              key={activeSection}
              value={activeValue}
              onChange={(e) => setSection(activeSection, e.target.value)}
              spellCheck={false}
              placeholder={PLACEHOLDERS[activeSection]}
              className="flex-1 resize-none font-mono text-xs px-5 py-3 bg-background outline-none border-0 leading-relaxed placeholder:text-muted-foreground/40"
              style={{ tabSize: 2 }}
            />
            <div className="px-5 py-2 border-t border-border text-[10px] text-muted-foreground">
              Auto fallback:{" "}
              <span className="italic">
                {activeFallback.length > 120 ? activeFallback.slice(0, 117) + "…" : activeFallback}
              </span>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
