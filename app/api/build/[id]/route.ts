export const maxDuration = 60

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callBuild } from "@/lib/engine"
import { pushCommit } from "@/lib/github"
import { NextRequest } from "next/server"
import AdmZip from "adm-zip"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const { data: cli } = await supabase
    .from("clis")
    .select(
      "id, name, provider_id, spec_content, spec_filename, config_yml, module_path, skill_notes, repo_owner, repo_name, last_commit_sha, builds_since_release, telemetry_token"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (!cli.spec_content || !cli.spec_filename) {
    return Response.json({ error: "No spec on file for this project" }, { status: 400 })
  }

  if (!cli.repo_owner || !cli.repo_name || !cli.last_commit_sha) {
    return Response.json(
      { error: "Repo not provisioned for this project" },
      { status: 400 }
    )
  }

  try {
    const engineRes = await callBuild(cli.spec_content, cli.spec_filename, {
      configYml: cli.config_yml ?? undefined,
      modulePath: cli.module_path ?? undefined,
      notes: (cli.skill_notes ?? "") as string,
      feedbackToken: cli.telemetry_token ?? undefined,
      feedbackEndpoint: process.env.FEEDBACK_ENDPOINT_URL || undefined,
    })
    const zipBuffer = Buffer.from(await engineRes.arrayBuffer())

    const zip = new AdmZip(zipBuffer)
    const files = new Map<string, Buffer>()
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue
      const stripped = entry.entryName.replace(/^[^/]+\//, "")
      if (!stripped) continue
      files.set(stripped, entry.getData())
    }
    if (cli.config_yml) {
      files.set("clicreator.yml", Buffer.from(cli.config_yml, "utf-8"))
    }

    const newSha = await pushCommit(
      cli.repo_owner,
      cli.repo_name,
      files,
      cli.last_commit_sha,
      "rebuild: regenerate CLI from updated config"
    )

    await supabase
      .from("clis")
      .update({
        last_commit_sha: newSha,
        last_build_at: new Date().toISOString(),
        builds_since_release: (cli.builds_since_release ?? 0) + 1,
      })
      .eq("id", id)

    const commitUrl = `https://github.com/${cli.repo_owner}/${cli.repo_name}/commit/${newSha}`
    return Response.json({ ok: true, commitSha: newSha, commitUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Build failed"
    console.error("[api/build] failed:", err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
