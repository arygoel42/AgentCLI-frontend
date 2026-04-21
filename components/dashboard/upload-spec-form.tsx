"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Link2, ArrowRight, Loader2 } from "lucide-react"
import { createProject } from "@/app/dashboard/actions"

type UploadSpecFormProps = {
  onSuccess?: (id: string) => void
}

export function UploadSpecForm({ onSuccess }: UploadSpecFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [specUrl, setSpecUrl] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreate = specUrl.trim().length > 0 || fileName !== null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  async function handleCreate() {
    if (!canCreate || isPending) return
    setIsPending(true)
    setError(null)

    const fd = new FormData()
    const file = fileRef.current?.files?.[0]
    if (file) {
      fd.append("specFile", file)
    } else if (specUrl.trim()) {
      fd.append("specUrl", specUrl.trim())
    }

    try {
      const { id } = await createProject(fd)
      if (onSuccess) {
        onSuccess(id)
      } else {
        router.push(`/dashboard/projects/${id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-3">
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="url"
            value={specUrl}
            onChange={(e) => setSpecUrl(e.target.value)}
            placeholder="https://api.example.com/openapi.json"
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-50"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <label className={`flex items-center justify-center gap-2 w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
          <Upload className="w-4 h-4" />
          {fileName ?? "Upload a .json or .yaml file"}
          <input
            ref={fileRef}
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isPending}
          />
        </label>
      </div>

      <button
        onClick={handleCreate}
        disabled={!canCreate || isPending}
        className="mt-5 flex items-center justify-center gap-2 w-full rounded-md py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        style={{ backgroundColor: "var(--green)", color: "#000" }}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating…
          </>
        ) : (
          <>
            Create project
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
