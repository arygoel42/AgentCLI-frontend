"use client"

import { Terminal, ArrowRight, Upload } from "lucide-react"
import { CopyButton } from "./copy-button"
import { UploadSpecForm } from "./upload-spec-form"

export function ProjectsEmptyState() {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6 items-stretch">
      {/* Upload spec */}
      <div className="rounded-xl border border-border p-6 flex flex-col">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--green-glow)" }}
        >
          <Upload className="w-5 h-5" style={{ color: "var(--green)" }} />
        </div>
        <h2 className="text-base font-semibold">Upload your OpenAPI spec</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paste a URL or upload a file — we&apos;ll generate a CLI for it.
        </p>

        <div className="mt-5 flex-1">
          <UploadSpecForm />
        </div>
      </div>

      {/* OR divider */}
      <div className="flex md:flex-col items-center justify-center gap-3 py-2 md:py-0">
        <div className="h-px md:h-full md:w-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground tracking-wider">OR</span>
        <div className="h-px md:h-full md:w-px flex-1 bg-border" />
      </div>

      {/* Use the CLI */}
      <div className="rounded-xl border border-border p-6 flex flex-col">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-muted">
          <Terminal className="w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold">Use the petl CLI</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Already live in your repo? Install the CLI and run <code className="text-xs">petl init</code>.
        </p>

        <div className="mt-5 space-y-3 flex-1">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">1. Install</p>
            <div className="flex items-center justify-between gap-2 bg-muted rounded-md px-3 py-2">
              <code className="text-xs font-mono truncate">brew install petl-dev/tap/petl</code>
              <CopyButton value="brew install petl-dev/tap/petl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">2. Initialize</p>
            <div className="flex items-center justify-between gap-2 bg-muted rounded-md px-3 py-2">
              <code className="text-xs font-mono truncate">petl init</code>
              <CopyButton value="petl init" />
            </div>
          </div>
        </div>

        <a
          href="/docs"
          className="mt-5 flex items-center justify-center gap-2 w-full rounded-md border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Read the docs
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
