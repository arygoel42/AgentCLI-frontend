"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Download, ExternalLink, Loader2, Trash2 } from "lucide-react"
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

type StudioHeaderProps = {
  cliName: string
  cliId: string
  repoUrl?: string | null
  repoOwner?: string | null
  repoName?: string | null
  inviteSentAt?: string | null
  inviteAcceptedAt?: string | null
}

export function StudioHeader({
  cliName,
  cliId,
  repoUrl,
  repoOwner,
  repoName,
  inviteSentAt,
  inviteAcceptedAt,
}: StudioHeaderProps) {
  const router = useRouter()
  const [building, setBuilding] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cloneUrl =
    repoOwner && repoName ? `git@github.com:${repoOwner}/${repoName}.git` : null
  const invitePending = !!inviteSentAt && !inviteAcceptedAt

  function copyClone() {
    if (!cloneUrl) return
    navigator.clipboard.writeText(cloneUrl)
    toast.success("Clone URL copied")
  }

  async function handleBuild() {
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

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">CLI Studio</span>
        <h1 className="text-sm font-semibold leading-tight">{cliName}</h1>
      </div>

      <div className="flex items-center gap-2">
        {repoUrl ? (
          <div className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md border border-border">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-mono">{repoOwner}/{repoName}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {cloneUrl && (
              <button
                onClick={copyClone}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy clone URL"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
            {invitePending && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: "var(--yellow, #facc15)", color: "#000" }}
                title="Check your GitHub email to accept the collaborator invite"
              >
                Invite pending
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Repo not provisioned</span>
        )}

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
          onClick={handleBuild}
          disabled={building}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-70"
          style={{ backgroundColor: "var(--green)", color: "#000" }}
        >
          {building ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Building…</>
          ) : (
            <><Download className="w-3.5 h-3.5" /> Build</>
          )}
        </button>
      </div>
    </div>
  )
}
