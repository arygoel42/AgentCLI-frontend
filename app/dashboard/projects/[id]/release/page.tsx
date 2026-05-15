export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ReleaseShell } from "@/components/studio/release-shell"
import { parseConfig } from "@/lib/parse-yml"

export default async function ReleasePage({
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
      "id, name, provider_id, config_yml, provisioning_status, repo_owner, repo_name, release_status, release_error, latest_release_version, latest_release_url, latest_release_at, builds_since_release, homebrew_formula_url, docs_published"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) notFound()

  // If the release is stuck in_progress on page load, the request died (e.g. Vercel timeout).
  // Reset it to failed so the user sees a retry option instead of a permanent spinner.
  let releaseStatus = (cli.release_status ?? "idle") as "idle" | "in_progress" | "completed" | "failed"
  let releaseError = cli.release_error ?? null
  if (releaseStatus === "in_progress") {
    releaseStatus = "failed"
    releaseError = "Release timed out or was interrupted. Please try again."
    await supabase
      .from("clis")
      .update({ release_status: "failed", release_error: releaseError })
      .eq("id", cli.id)
  }

  const parsed = parseConfig(cli.config_yml ?? "")
  const version = parsed.cli?.version ?? null
  const cliName = parsed.cli?.name ?? cli.name

  return (
    <ReleaseShell
      cliId={cli.id}
      cliName={cliName}
      version={version}
      latestReleaseVersion={cli.latest_release_version ?? null}
      latestReleaseUrl={cli.latest_release_url ?? null}
      latestReleaseAt={cli.latest_release_at ?? null}
      buildsSinceRelease={cli.builds_since_release ?? 0}
      initialReleaseStatus={releaseStatus}
      initialReleaseError={releaseError}
      provisioningStatus={cli.provisioning_status ?? "pending"}
      repoOwner={cli.repo_owner ?? null}
      repoName={cli.repo_name ?? null}
    />
  )
}
