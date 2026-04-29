"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UploadSpecForm } from "./upload-spec-form"

export function NewProjectButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleSuccess(id: string) {
    setOpen(false)
    router.push(`/dashboard/projects/${id}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-md transition-colors"
        style={{ backgroundColor: "var(--green)", color: "#000" }}
      >
        <Plus className="w-4 h-4" />
        New project
      </button>

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
    </>
  )
}
