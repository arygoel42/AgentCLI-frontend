"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Activity, FileCode2, Link2, Loader2, MessageSquare, Trash2, Upload } from "lucide-react"
import { saveDataSettings, deleteProject, updateSpec } from "@/app/dashboard/projects/[id]/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none"
      style={{ backgroundColor: enabled ? "var(--green)" : "var(--muted)" }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: enabled ? "translateX(16px)" : "translateX(0px)" }}
      />
    </button>
  )
}

function UpdateSpecSheet({ cliId, specFilename }: { cliId: string; specFilename: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [specUrl, setSpecUrl] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = specUrl.trim().length > 0 || fileName !== null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) { setFileName(file.name); setSpecUrl("") }
  }

  async function handleSubmit() {
    if (!canSubmit || pending) return
    setPending(true)
    setError(null)
    const fd = new FormData()
    const file = fileRef.current?.files?.[0]
    if (file) {
      fd.append("specFile", file)
    } else if (specUrl.trim()) {
      fd.append("specUrl", specUrl.trim())
    }
    try {
      await updateSpec(cliId, fd)
      toast.success("Spec updated — resources and auth refreshed from new spec")
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update spec")
    } finally {
      setPending(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) { setSpecUrl(""); setFileName(null); setError(null) }
    setOpen(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
          Update spec
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="text-sm">Update OpenAPI spec</SheetTitle>
          <SheetDescription className="text-xs">
            Resources, auth, and base URL will be replaced from the new spec.
            Your CLI name, version, and custom environments are preserved.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={specUrl}
              onChange={(e) => { setSpecUrl(e.target.value); setFileName(null) }}
              placeholder="https://api.example.com/openapi.json"
              disabled={pending}
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <label className={`flex items-center justify-center gap-2 w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors ${pending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            <Upload className="w-4 h-4" />
            {fileName ?? "Upload a .json or .yaml file"}
            <input
              ref={fileRef}
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileSelect}
              className="hidden"
              disabled={pending}
            />
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || pending}
            className="flex items-center justify-center gap-2 w-full rounded-md py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--green)", color: "#000" }}
          >
            {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Update spec"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

type SettingsTabProps = {
  cliId: string
  cliName: string
  specFilename: string
  initialTelemetryEnabled: boolean
  initialFeedbackEnabled: boolean
}

export function SettingsTab({ cliId, cliName, specFilename, initialTelemetryEnabled, initialFeedbackEnabled }: SettingsTabProps) {
  const router = useRouter()
  const [telemetryEnabled, setTelemetryEnabled] = useState(initialTelemetryEnabled)
  const [feedbackEnabled, setFeedbackEnabled] = useState(initialFeedbackEnabled)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const dirty = telemetryEnabled !== initialTelemetryEnabled || feedbackEnabled !== initialFeedbackEnabled

  async function save() {
    setSaving(true)
    try {
      await saveDataSettings(cliId, { telemetryEnabled, feedbackEnabled })
      toast.success("Settings saved — rebuild the CLI to apply changes")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProject(cliId)
      toast.success("Project deleted")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to delete project")
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="p-6 space-y-8">
        <div>
          <h3 className="text-sm font-semibold">OpenAPI Spec</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Replace the spec to regenerate resources and auth. Your CLI name, version, and custom environments are preserved.
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/10 p-4">
            <FileCode2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <code className="text-xs font-mono flex-1 truncate">{specFilename}</code>
            <UpdateSpecSheet cliId={cliId} specFilename={specFilename} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Data collection</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Changes take effect on the next build.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/10 p-4">
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Usage telemetry</p>
                <p className="text-xs text-muted-foreground">
                  Tracks command invocations, error rates, and caller type (human vs agent).
                </p>
              </div>
            </div>
            <Toggle enabled={telemetryEnabled} onChange={setTelemetryEnabled} />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/10 p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Feedback command</p>
                <p className="text-xs text-muted-foreground">
                  Adds a <code className="font-mono text-[11px]">feedback</code> command to the CLI
                  so agents and users can send messages directly to your dashboard.
                </p>
              </div>
            </div>
            <Toggle enabled={feedbackEnabled} onChange={setFeedbackEnabled} />
          </div>
        </div>

        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          style={{ backgroundColor: "var(--green)", color: "#000" }}
        >
          {saving ? "Saving…" : "Save settings"}
        </button>

        <div className="border-t border-border pt-8">
          <h3 className="text-sm font-semibold text-red-500">Danger zone</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Permanently delete this project and all its data.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={deleting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete project
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {cliName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes the project, spec, and config. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
