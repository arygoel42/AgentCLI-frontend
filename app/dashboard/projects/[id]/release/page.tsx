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
      "id, name, provider_id, config_yml, provisioning_status, repo_owner, repo_name, release_status, release_error, latest_release_version, latest_release_url, latest_release_at, builds_since_release, homebrew_formula_url"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) notFound()

  const parsed = parseConfig(cli.config_yml ?? "")
  const version = parsed.cli?.version ?? null

  return (
    <ReleaseShell
      cliId={cli.id}
      cliName={cli.name}
      version={version}
      latestReleaseVersion={cli.latest_release_version ?? null}
      latestReleaseUrl={cli.latest_release_url ?? null}
      latestReleaseAt={cli.latest_release_at ?? null}
      buildsSinceRelease={cli.builds_since_release ?? 0}
      initialReleaseStatus={(cli.release_status ?? "idle") as "idle" | "in_progress" | "completed" | "failed"}
      initialReleaseError={cli.release_error ?? null}
      provisioningStatus={cli.provisioning_status ?? "pending"}
      repoOwner={cli.repo_owner ?? null}
      repoName={cli.repo_name ?? null}
    />
  )
}
