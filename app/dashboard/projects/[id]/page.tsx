import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import { StudioShell } from "@/components/studio/studio-shell"
import type { PreviewResponse } from "@/lib/engine"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const supabase = createClient()

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) redirect("/")

  const { data: cli } = await supabase
    .from("clis")
    .select(
      "id, name, provider_id, config_yml, spec_content, spec_filename, preview_json, repo_url, repo_owner, repo_name, invite_sent_at, invite_accepted_at"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) notFound()

  let previewData: PreviewResponse | null = null
  if (cli.preview_json) {
    try {
      previewData = JSON.parse(cli.preview_json) as PreviewResponse
    } catch {
      // fall through to null
    }
  }

  if (!previewData) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">
          No preview data available for this project.
        </p>
      </div>
    )
  }

  return (
    <StudioShell
      cli={{
        id: cli.id,
        name: cli.name,
        config_yml: cli.config_yml ?? "",
        spec_content: cli.spec_content ?? "",
        spec_filename: cli.spec_filename ?? "openapi.yaml",
        repo_url: cli.repo_url ?? null,
        repo_owner: cli.repo_owner ?? null,
        repo_name: cli.repo_name ?? null,
        invite_sent_at: cli.invite_sent_at ?? null,
        invite_accepted_at: cli.invite_accepted_at ?? null,
      }}
      previewData={previewData}
    />
  )
}
