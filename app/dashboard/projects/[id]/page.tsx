import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import { StudioShell } from "@/components/studio/studio-shell"
import { callPreview, type PreviewResponse } from "@/lib/engine"

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
      "id, name, provider_id, config_yml, spec_content, spec_filename, preview_json, skills, repo_url, repo_owner, repo_name, invite_sent_at, invite_accepted_at, provisioning_status"
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

  // Backfill: previews stored before the engine started returning default_skills
  // will lack them. Re-render once and persist so subsequent loads are cheap.
  if (previewData && (!previewData.default_skills || Object.keys(previewData.default_skills).length === 0) && cli.spec_content) {
    try {
      const refreshed = await callPreview(cli.spec_content, cli.spec_filename ?? "openapi.yaml", cli.config_yml ?? undefined)
      previewData = refreshed
      await supabase
        .from("clis")
        .update({ preview_json: JSON.stringify(refreshed) })
        .eq("id", id)
    } catch (err) {
      console.error("[skills backfill] failed:", err)
      // Keep the stale preview — SkillsTab will just show empty defaults until next save
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
        skills: (cli.skills ?? {}) as Record<string, string>,
        provisioning_status: (cli.provisioning_status ?? "pending") as "pending" | "in_progress" | "completed" | "failed",
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
