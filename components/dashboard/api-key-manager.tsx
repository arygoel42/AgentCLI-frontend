"use client"

import { useState } from "react"
import { AlertTriangle, RefreshCw, KeyRound } from "lucide-react"
import { CopyButton } from "./copy-button"
import { createApiKey, rotateApiKey } from "@/app/dashboard/api-key/actions"

interface Props {
  hasKey: boolean
  hint: string | null
}

export function ApiKeyManager({ hasKey: initialHasKey, hint: initialHint }: Props) {
  const [hasKey, setHasKey] = useState(initialHasKey)
  const [hint, setHint] = useState(initialHint)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)

  async function handleCreate() {
    setLoading(true)
    const { key } = await createApiKey()
    setRevealed(key)
    setHint(key.slice(-4))
    setHasKey(true)
    setLoading(false)
  }

  async function handleRotate() {
    setLoading(true)
    setConfirmRotate(false)
    const { key } = await rotateApiKey()
    setRevealed(key)
    setHint(key.slice(-4))
    setLoading(false)
  }

  function handleDismiss() {
    setRevealed(null)
  }

  // No key yet — prompt to create
  if (!hasKey) {
    return (
      <div className="rounded-lg border p-8 flex flex-col items-center text-center gap-4 max-w-md" style={{ borderColor: "var(--green-border)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--green-glow)" }}>
          <KeyRound className="w-5 h-5" style={{ color: "var(--green)" }} />
        </div>
        <div>
          <p className="text-sm font-medium">No API key yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generate a key to call the petl API from scripts or CI pipelines.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--green)", color: "#000" }}
        >
          {loading ? "Generating…" : "Generate API Key"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-xl">
      {/* One-time reveal */}
      {revealed ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Save this key now</p>
              <p className="text-xs text-amber-500/80 mt-0.5">
                It won&apos;t be shown again. If you lose it, you&apos;ll need to rotate.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 bg-background rounded-md border border-border px-3 py-2">
            <code className="text-xs font-mono break-all">{revealed}</code>
            <CopyButton value={revealed} />
          </div>
          <button
            onClick={handleDismiss}
            className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            I&apos;ve saved it
          </button>
        </div>
      ) : (
        /* Masked key */
        <div className="rounded-lg border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Your API Key</h2>
            <button
              onClick={() => setConfirmRotate(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Rotate
            </button>
          </div>
          <div className="flex items-center gap-3 bg-muted rounded-md px-3 py-2">
            <code className="text-xs font-mono text-muted-foreground">
              petl_pk_••••••••••••••••••{hint}
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            Pass this in the <code className="text-foreground">Authorization: Bearer</code> header when calling the petl API.
          </p>
        </div>
      )}

      {/* Rotate confirmation */}
      {confirmRotate && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm font-medium text-destructive">Rotate API key?</p>
          <p className="text-xs text-muted-foreground">
            Your current key will be invalidated immediately. Any scripts or pipelines using it will stop working until you update them.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRotate}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Rotating…" : "Yes, rotate"}
            </button>
            <button
              onClick={() => setConfirmRotate(false)}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
