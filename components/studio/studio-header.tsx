"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2, Trash2, Rocket } from "lucide-react"
import { toast } from "sonner"
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
import { deleteProject } from "@/app/dashboard/projects/[id]/actions"
import { ProvisioningPill } from "./provisioning-pill"

type ProvisioningStatus = "pending" | "in_progress" | "completed" | "failed"

type StudioHeaderProps = {
  cliName: string
  cliId: string
  provisioningStatus: ProvisioningStatus
  repoUrl?: string | null
  repoOwner?: string | null
  repoName?: string | null
  inviteSentAt?: string | null
  inviteAcceptedAt?: string | null
  latestReleaseVersion?: string | null
}

export function StudioHeader({
  cliName,
  cliId,
  provisioningStatus,
  repoUrl,
  repoOwner,
  repoName,
  inviteSentAt,
  inviteAcceptedAt,
  latestReleaseVersion,
}: StudioHeaderProps) {
  const router = useRouter()
  const [building, setBuilding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [liveStatus, setLiveStatus] = useState<ProvisioningStatus>(provisioningStatus)

  const buildReady = liveStatus === "completed"

  async function handleBuild() {
    if (!buildReady) return
    setBuilding(true)
    try {
      const res = await fetch(`/api/build/${cliId}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Build failed")
      } else {
        toast.success("Pushed new commit", {
          action: {
            label: "View",
            onClick: () => window.open(data.commitUrl, "_blank"),
          },
        })
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Build failed")
    } finally {
      setBuilding(false)
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

  const buildLabel = !buildReady
    ? liveStatus === "failed"
      ? "Repo unavailable"
      : "Waiting for repo…"
    : building
    ? "Building…"
    : "Build"

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">CLI Studio</span>
        <h1 className="text-sm font-semibold leading-tight">{cliName}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ProvisioningPill
          cliId={cliId}
          initialStatus={provisioningStatus}
          initialRepoUrl={repoUrl ?? null}
          initialRepoOwner={repoOwner ?? null}
          initialRepoName={repoName ?? null}
          initialInviteSentAt={inviteSentAt ?? null}
          initialInviteAcceptedAt={inviteAcceptedAt ?? null}
          onStatusChange={(s) => {
            setLiveStatus(s)
            if (s === "completed") router.refresh()
          }}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
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

        <button
          onClick={() => router.push(`/dashboard/projects/${cliId}/release`)}
          disabled={!buildReady}
          title={!buildReady ? "Repo provisioning must finish first" : "Publish a versioned release"}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Rocket className="w-3.5 h-3.5" />
          Release
          {latestReleaseVersion && (
            <span className="text-[10px] font-mono opacity-60">v{latestReleaseVersion}</span>
          )}
        </button>

        <button
          onClick={handleBuild}
          disabled={building || !buildReady}
          title={!buildReady ? "Repo provisioning must finish first" : undefined}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--green)", color: "#000" }}
        >
          {building ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {buildLabel}
        </button>
      </div>
    </div>
  )
}
