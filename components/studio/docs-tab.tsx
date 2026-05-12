"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { ExternalLink, FileText, Save } from "lucide-react"
import Link from "next/link"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { saveDocsMd } from "@/app/dashboard/projects/[id]/actions"
import { DocsPreview } from "@/components/docs/docs-preview"
import { buildDocsViewModel, slugify } from "@/lib/docs-render"
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

export function DocsTab({
  cliId,
  cliName,
  initialDocsMd,
  userDocs,
  repoOwner,
  repoName,
  docsPublished,
}: DocsTabProps) {
  const [docsMd, setDocsMd] = useState(initialDocsMd)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const lastSavedRef = useRef(initialDocsMd)

  useEffect(() => {
    if (docsMd === lastSavedRef.current) return
    setSaveStatus("saving")
    const timer = setTimeout(async () => {
      try {
        await saveDocsMd(cliId, docsMd)
        lastSavedRef.current = docsMd
        setSaveStatus("saved")
      } catch (err) {
        console.error("[docs autosave] failed:", err)
        setSaveStatus("error")
        toast.error(err instanceof Error ? err.message : "Docs autosave failed")
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [docsMd, cliId])

  const slug = slugify(cliName)
  const viewModel = buildDocsViewModel({
    userDocs,
    docsMd,
    cliName,
    repoOwner,
    repoName,
    origin: typeof window !== "undefined" ? window.location.origin : null,
    slug,
  })

  const publicHref = `/docs/${slug}`

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
            Deterministically generated from your spec. Edit the intro to add your own framing — auto sections always stay in sync.
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

      {/* Split: preview left, intro editor right */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
        <ResizablePanel defaultSize={60} minSize={35}>
          <div className="h-full overflow-y-auto bg-background">
            <DocsPreview viewModel={viewModel} compact />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="h-full flex flex-col bg-background">
            <div className="px-5 py-2 border-b border-border">
              <p className="text-xs font-medium">Intro / overview (markdown)</p>
              <p className="text-[10px] text-muted-foreground">
                Shown at the top of the docs site before the API reference. Auto sections below regenerate from the spec.
              </p>
            </div>
            <textarea
              value={docsMd}
              onChange={(e) => setDocsMd(e.target.value)}
              spellCheck={false}
              placeholder={`# What this CLI does\n\nA short overview your users see first. Mention the problem it solves and link out to anything they should read before installing.\n\n## When to use it\n\nBullet a few common workflows so readers know whether to keep reading.`}
              className="flex-1 resize-none font-mono text-xs px-5 py-3 bg-background outline-none border-0 leading-relaxed placeholder:text-muted-foreground/40"
              style={{ tabSize: 2 }}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
