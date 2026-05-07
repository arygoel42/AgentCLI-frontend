"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Activity, MessageSquare, Loader2, Trash2 } from "lucide-react"
import { saveDataSettings, deleteProject } from "@/app/dashboard/projects/[id]/actions"
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

type SettingsTabProps = {
  cliId: string
  cliName: string
  initialTelemetryEnabled: boolean
  initialFeedbackEnabled: boolean
}

export function SettingsTab({ cliId, cliName, initialTelemetryEnabled, initialFeedbackEnabled }: SettingsTabProps) {
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
