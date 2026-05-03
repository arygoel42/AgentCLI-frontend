"use client"

import { useEffect, useState } from "react"
import { Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

type ProvisioningStatus = "pending" | "in_progress" | "completed" | "failed"

type StatusResponse = {
  status: ProvisioningStatus
  error: string | null
  repoUrl: string | null
  repoOwner: string | null
  repoName: string | null
  inviteSentAt: string | null
  inviteAcceptedAt: string | null
}

type ProvisioningPillProps = {
  cliId: string
  initialStatus: ProvisioningStatus
  initialRepoUrl: string | null
  initialRepoOwner: string | null
  initialRepoName: string | null
  initialInviteSentAt: string | null
  initialInviteAcceptedAt: string | null
  onStatusChange?: (status: ProvisioningStatus) => void
}

export function ProvisioningPill({
  cliId,
  initialStatus,
  initialRepoUrl,
  initialRepoOwner,
  initialRepoName,
  initialInviteSentAt,
  initialInviteAcceptedAt,
  onStatusChange,
}: ProvisioningPillProps) {
  const [data, setData] = useState<StatusResponse>({
    status: initialStatus,
    error: null,
    repoUrl: initialRepoUrl,
    repoOwner: initialRepoOwner,
    repoName: initialRepoName,
    inviteSentAt: initialInviteSentAt,
    inviteAcceptedAt: initialInviteAcceptedAt,
  })
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const invitePending = !!data.inviteSentAt && !data.inviteAcceptedAt
    if (data.status === "failed") return
    if (data.status === "completed" && !invitePending) return

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${cliId}/status`)
        if (!res.ok) return
        const next: StatusResponse = await res.json()
        if (cancelled) return
        setData(next)
        onStatusChange?.(next.status)
        const nextInvitePending = !!next.inviteSentAt && !next.inviteAcceptedAt
        if (next.status === "failed") clearInterval(interval)
        if (next.status === "completed" && !nextInvitePending) clearInterval(interval)
      } catch {
        // network blip — keep polling
      }
    }, 3000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [cliId, data.status, data.inviteSentAt, data.inviteAcceptedAt, onStatusChange])

  async function handleRetry() {
    setRetrying(true)
    try {
      const res = await fetch(`/api/projects/${cliId}/provision`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Retry failed")
      } else {
        setData((d) => ({ ...d, status: "in_progress", error: null }))
        onStatusChange?.("in_progress")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed")
    } finally {
      setRetrying(false)
    }
  }

  function copyClone() {
    if (!data.repoOwner || !data.repoName) return
    navigator.clipboard.writeText(`git@github.com:${data.repoOwner}/${data.repoName}.git`)
    toast.success("Clone URL copied")
  }

  if (data.status === "pending" || data.status === "in_progress") {
    return (
      <div className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md border border-border text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Provisioning repo…
      </div>
    )
  }

  if (data.status === "failed") {
    return (
      <div className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md border border-red-500/40 text-red-500">
        <span className="truncate max-w-[200px]" title={data.error ?? undefined}>
          {data.error ?? "Provisioning failed"}
        </span>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="ml-1 hover:text-red-400 transition-colors disabled:opacity-50"
          title="Retry"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} />
        </button>
      </div>
    )
  }

  // completed
  if (!data.repoUrl) return null
  const invitePending = !!data.inviteSentAt && !data.inviteAcceptedAt

  return (
    <div className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md border border-border">
      <a
        href={data.repoUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-mono">
          {data.repoOwner}/{data.repoName}
        </span>
        <ExternalLink className="w-3 h-3" />
      </a>
      <button
        onClick={copyClone}
        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        title="Copy clone URL"
      >
        <Copy className="w-3 h-3" />
      </button>
      {invitePending && (
        <span
          className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-400"
          title="Check your GitHub email to accept the collaborator invite"
        >
          Invite pending
        </span>
      )}
    </div>
  )
}
