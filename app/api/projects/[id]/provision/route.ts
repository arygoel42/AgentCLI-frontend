import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callBuild } from "@/lib/engine"
import {
  createStagingRepo,
  inviteCollaborator,
  pushInitialCommit,
} from "@/lib/github"
import { NextRequest } from "next/server"
import AdmZip from "adm-zip"

// Vercel server cap. Big specs (Spotify-class) can take 10-30s of GitHub work.
export const maxDuration = 60

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

  // Verify ownership and pull in everything we need to build + commit.
  const { data: cli } = await supabase
    .from("clis")
    .select(
      "id, name, provider_id, spec_content, spec_filename, config_yml, module_path, provisioning_status"
    )
    .eq("id", id)
    .single()

  if (!cli) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("id, github_username")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider || provider.id !== cli.provider_id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (!cli.spec_content || !cli.spec_filename) {
    return Response.json({ error: "No spec on file" }, { status: 400 })
  }

  // Optimistic claim: only proceed if no one else has started this row.
  // Allow 'failed' to be re-claimed (retry path).
  const { data: claimed, error: claimErr } = await supabase
    .from("clis")
    .update({
      provisioning_status: "in_progress",
      provisioning_started_at: new Date().toISOString(),
      provisioning_error: null,
    })
    .eq("id", id)
    .in("provisioning_status", ["pending", "failed"])
    .select("id")

  if (claimErr) {
    return Response.json({ error: claimErr.message }, { status: 500 })
  }
  if (!claimed || claimed.length === 0) {
    // Already in_progress or completed — someone else has it. Idempotent no-op.
    return Response.json({ ok: true, skipped: true })
  }

  try {
    const engineRes = await callBuild(
      cli.spec_content,
      cli.spec_filename,
      cli.config_yml ?? undefined,
      cli.module_path ?? undefined
    )
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

    const repo = await createStagingRepo(
      cli.name,
      `CLI generated from ${cli.spec_filename}`
    )

    const commitMsg = `init: generate CLI from ${cli.spec_filename}`
    const commitSha = await pushInitialCommit(
      repo.owner,
      repo.name,
      files,
      commitMsg,
      repo.defaultBranch
    )

    let inviteSentAt: string | null = null
    if (provider.github_username) {
      try {
        await inviteCollaborator(repo.owner, repo.name, provider.github_username)
        inviteSentAt = new Date().toISOString()
      } catch (err) {
        // Org owners get auto-access (204 with no body); octokit may surface that
        // shape inconsistently. Don't fail provisioning over invite quirks.
        console.warn("[provision] invite warning:", err)
      }
    }

    await supabase
      .from("clis")
      .update({
        repo_url: repo.url,
        repo_owner: repo.owner,
        repo_name: repo.name,
        last_commit_sha: commitSha,
        invite_sent_at: inviteSentAt,
        provisioning_status: "completed",
      })
      .eq("id", id)

    return Response.json({ ok: true, repoUrl: repo.url, commitSha })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Provisioning failed"
    console.error("[provision] failed:", err)
    await supabase
      .from("clis")
      .update({
        provisioning_status: "failed",
        provisioning_error: msg,
      })
      .eq("id", id)
    return Response.json({ error: msg }, { status: 500 })
  }
}
