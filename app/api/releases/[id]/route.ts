import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callRelease } from "@/lib/engine"
import { createGithubRelease, generateInstallScript } from "@/lib/github-releases"
import { parseConfig } from "@/lib/parse-yml"
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

  if (!provider) return Response.json({ error: "Not found" }, { status: 404 })

  const { data: cli } = await supabase
    .from("clis")
    .select(
      "id, provider_id, name, spec_content, spec_filename, config_yml, module_path, skill_notes, repo_owner, repo_name, repo_url, provisioning_status, release_status, latest_release_version, telemetry_token"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (cli.provisioning_status !== "completed") {
    return Response.json({ error: "Repo must be provisioned before releasing" }, { status: 400 })
  }

  if (cli.release_status === "in_progress") {
    return Response.json({ error: "A release is already in progress" }, { status: 409 })
  }

  if (!cli.spec_content || !cli.spec_filename) {
    return Response.json({ error: "No spec on file for this project" }, { status: 400 })
  }

  const parsed = parseConfig(cli.config_yml ?? "")
  const version = parsed.cli?.version
  if (!version) {
    return Response.json(
      { error: "No version set in your config. Add a version field under the cli section." },
      { status: 400 }
    )
  }

  if (cli.latest_release_version === version) {
    return Response.json(
      { error: `v${version} has already been released. Bump the version in your config first.` },
      { status: 409 }
    )
  }

  const cliName = parsed.cli?.name ?? cli.name

  await supabase
    .from("clis")
    .update({ release_status: "in_progress", release_error: null })
    .eq("id", id)

  try {
    // 1. Cross-compile via engine
    const engineRes = await callRelease(cli.spec_content, cli.spec_filename, cliName, version, {
      configYml: cli.config_yml ?? undefined,
      modulePath: cli.module_path ?? undefined,
      notes: (cli.skill_notes ?? "") as string,
      feedbackToken: cli.telemetry_token ?? undefined,
      feedbackEndpoint: process.env.FEEDBACK_ENDPOINT_URL || undefined,
    })
    const zipBuffer = Buffer.from(await engineRes.arrayBuffer())

    // 2. Extract binaries
    const zip = new AdmZip(zipBuffer)
    const binaries = new Map<string, Buffer>()
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue
      const name = entry.entryName.replace(/^[^/]+\//, "")
      if (!name) continue
      binaries.set(name, entry.getData())
    }

    if (binaries.size === 0) {
      throw new Error("Engine returned an empty release zip")
    }

    // 3. Bundle install.sh as a release asset
    const installScript = generateInstallScript(cliName, cli.repo_owner!, cli.repo_name!)
    binaries.set("install.sh", Buffer.from(installScript, "utf-8"))

    // 4. Create GitHub release + upload all assets
    const { releaseUrl } = await createGithubRelease(
      cli.repo_owner!,
      cli.repo_name!,
      cliName,
      version,
      binaries,
    )

    // 5. Persist
    await supabase
      .from("clis")
      .update({
        release_status: "completed",
        release_error: null,
        latest_release_version: version,
        latest_release_url: releaseUrl,
        latest_release_at: new Date().toISOString(),
        homebrew_formula_url: null,
        builds_since_release: 0,
      })
      .eq("id", id)

    return Response.json({ ok: true, version, releaseUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Release failed"
    console.error("[api/releases] failed:", err)

    await supabase
      .from("clis")
      .update({ release_status: "failed", release_error: msg })
      .eq("id", id)

    return Response.json({ error: msg }, { status: 500 })
  }
}
