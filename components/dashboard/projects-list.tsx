"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Terminal, Plus, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UploadSpecForm } from "./upload-spec-form"

type CLIRow = {
  id: string
  name: string
  module_path: string | null
  current_version: string | null
  created_at: string
}

export function ProjectsList({ clis }: { clis: CLIRow[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleSuccess(id: string) {
    setOpen(false)
    router.push(`/dashboard/projects/${id}`)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors"
          style={{ backgroundColor: "var(--green)", color: "#000" }}
        >
          <Plus className="w-4 h-4" />
          New project
        </button>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {clis.map((cli) => (
          <Link
            key={cli.id}
            href={`/dashboard/projects/${cli.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--green-glow)" }}
            >
              <Terminal className="w-4 h-4" style={{ color: "var(--green)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{cli.name}</div>
              <div className="text-xs text-muted-foreground truncate">{cli.module_path ?? "—"}</div>
            </div>
            <div className="text-xs text-muted-foreground font-mono shrink-0">
              {cli.current_version ?? "—"}
            </div>
          </Link>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4" style={{ color: "var(--green)" }} />
              New project
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Paste a URL or upload a file — we&apos;ll generate a CLI for it.
          </p>
          <UploadSpecForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
