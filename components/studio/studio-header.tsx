"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2, Trash2 } from "lucide-react"
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
}

export function StudioHeader({ cliName, cliId }: StudioHeaderProps) {
  const router = useRouter()
  const [building, setBuilding] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleBuild() {
    setBuilding(true)
    window.location.href = `/api/build/${cliId}`
    setTimeout(() => setBuilding(false), 3000)
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
