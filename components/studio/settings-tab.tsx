"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Activity, MessageSquare } from "lucide-react"
import { saveDataSettings } from "@/app/dashboard/projects/[id]/actions"

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
  initialTelemetryEnabled: boolean
  initialFeedbackEnabled: boolean
}

export function SettingsTab({ cliId, initialTelemetryEnabled, initialFeedbackEnabled }: SettingsTabProps) {
  const router = useRouter()
  const [telemetryEnabled, setTelemetryEnabled] = useState(initialTelemetryEnabled)
  const [feedbackEnabled, setFeedbackEnabled] = useState(initialFeedbackEnabled)
  const [saving, setSaving] = useState(false)

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

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="p-6 max-w-lg space-y-8">
        <div>
          <h3 className="text-sm font-semibold">Data collection</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Changes take effect on the next build.
          </p>
        </div>

        <div className="space-y-4">
          {/* Telemetry toggle */}
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

          {/* Feedback toggle */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/10 p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Feedback command</p>
                <p className="text-xs text-muted-foreground">
                  Adds a <code className="font-mono text-[11px]">feedback</code> command to the CLI
                  so agents and users can send messages directly to your dashboard.                </p>
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
      </div>
    </div>
  )
}
