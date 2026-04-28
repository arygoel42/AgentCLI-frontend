import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"

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
      "id, provider_id, repo_url, repo_owner, repo_name, last_commit_sha, invite_sent_at, invite_accepted_at, provisioning_status, provisioning_error"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({
    status: cli.provisioning_status,
    error: cli.provisioning_error,
    repoUrl: cli.repo_url,
    repoOwner: cli.repo_owner,
    repoName: cli.repo_name,
    lastCommitSha: cli.last_commit_sha,
    inviteSentAt: cli.invite_sent_at,
    inviteAcceptedAt: cli.invite_accepted_at,
  })
}
