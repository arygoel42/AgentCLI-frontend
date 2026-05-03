import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { Octokit } from "@octokit/rest"
import { NextRequest } from "next/server"

function botToken(): string {
  const token = process.env.GITHUB_BOT_TOKEN
  if (!token) throw new Error("GITHUB_BOT_TOKEN is not set")
  return token
}

// Lightweight polling endpoint used by the studio's provisioning pill.
export async function GET(
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
    .select("id, github_username")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const { data: cli } = await supabase
    .from("clis")
    .select(
      "id, provider_id, repo_url, repo_owner, repo_name, last_commit_sha, invite_sent_at, invite_accepted_at, provisioning_status, provisioning_error"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  let inviteAcceptedAt = cli.invite_accepted_at

  // If invite was sent but not yet recorded as accepted, check GitHub live.
  if (cli.invite_sent_at && !inviteAcceptedAt && cli.repo_owner && cli.repo_name && provider.github_username) {
    try {
      const octokit = new Octokit({ auth: botToken() })
      // Returns 204 if the user is a collaborator, throws on 404 if not.
      await octokit.repos.checkCollaborator({
        owner: cli.repo_owner,
        repo: cli.repo_name,
        username: provider.github_username,
      })
      // If we get here, they accepted — persist it so we don't keep checking.
      inviteAcceptedAt = new Date().toISOString()
      await supabase
        .from("clis")
        .update({ invite_accepted_at: inviteAcceptedAt })
        .eq("id", id)
    } catch {
      // 404 = still pending or not a collaborator — leave inviteAcceptedAt null
    }
  }

  return Response.json({
    status: cli.provisioning_status,
    error: cli.provisioning_error,
    repoUrl: cli.repo_url,
    repoOwner: cli.repo_owner,
    repoName: cli.repo_name,
    lastCommitSha: cli.last_commit_sha,
    inviteSentAt: cli.invite_sent_at,
    inviteAcceptedAt,
  })
}
