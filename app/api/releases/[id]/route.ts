export const maxDuration = 60

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callBuild } from "@/lib/engine"
import { generateInstallScript } from "@/lib/github-releases"
import { parseConfig } from "@/lib/parse-yml"
import { pushCommit } from "@/lib/github"
import { NextRequest } from "next/server"
import AdmZip from "adm-zip"
import { Octokit } from "@octokit/rest"

// GitHub Actions workflow that cross-compiles for all platforms and publishes a release.
// Triggered by the tag push we create at the end of the POST handler.
const RELEASE_WORKFLOW = `name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    name: Build \${{ matrix.goos }}-\${{ matrix.goarch }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - goos: darwin
            goarch: arm64
          - goos: darwin
            goarch: amd64
          - goos: linux
            goarch: amd64
          - goos: linux
            goarch: arm64
          - goos: windows
            goarch: amd64

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: 'stable'
          cache: false

      - name: Tidy modules
        run: go mod tidy

      - name: Build
        env:
          GOOS: \${{ matrix.goos }}
          GOARCH: \${{ matrix.goarch }}
          CGO_ENABLED: '0'
          REPO_NAME: \${{ github.event.repository.name }}
        run: |
          EXT=""
          if [ "$GOOS" = "windows" ]; then EXT=".exe"; fi
          CMD_DIR=$(cat .cli-name 2>/dev/null || ls cmd/ | head -1)
          go build -o "$REPO_NAME-$GOOS-$GOARCH$EXT" ./cmd/$CMD_DIR

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: \${{ matrix.goos }}-\${{ matrix.goarch }}
          path: \${{ github.event.repository.name }}-\${{ matrix.goos }}-\${{ matrix.goarch }}*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v4
        with:
          path: binaries
          merge-multiple: true

      - name: Add install script
        run: cp install.sh binaries/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: binaries/*
          generate_release_notes: true
`

function botToken(): string {
  const token = process.env.GITHUB_BOT_TOKEN
  if (!token) throw new Error("GITHUB_BOT_TOKEN is not set")
  return token
}

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
      "id, provider_id, name, spec_content, spec_filename, config_yml, module_path, skill_notes, repo_owner, repo_name, repo_url, provisioning_status, release_status, latest_release_version, telemetry_token, last_commit_sha"
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

  if (!cli.repo_owner || !cli.repo_name || !cli.last_commit_sha) {
    return Response.json({ error: "Repo not fully provisioned" }, { status: 400 })
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
  const repoOwner = cli.repo_owner
  const repoName = cli.repo_name

  await supabase
    .from("clis")
    .update({ release_status: "in_progress", release_error: null })
    .eq("id", id)

  try {
    // 1. Get Go source code from the engine
    const engineRes = await callBuild(cli.spec_content, cli.spec_filename, {
      configYml: cli.config_yml ?? undefined,
      modulePath: cli.module_path ?? undefined,
      notes: (cli.skill_notes ?? "") as string,
      feedbackToken: cli.telemetry_token ?? undefined,
      feedbackEndpoint: process.env.FEEDBACK_ENDPOINT_URL || undefined,
    })
    const zipBuffer = Buffer.from(await engineRes.arrayBuffer())

    // 2. Unzip into a file map (strip the leading directory component)
    const zip = new AdmZip(zipBuffer)
    const files = new Map<string, Buffer>()
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue
      const name = entry.entryName.replace(/^[^/]+\//, "")
      if (!name) continue
      files.set(name, entry.getData())
    }

    if (files.size === 0) {
      throw new Error("Engine returned an empty source zip")
    }

    // 3. Add install.sh — binary is named after the repo (REPO_NAME in the workflow),
    //    so the install script must use repoName, not the API spec's cliName.
    const installScript = generateInstallScript(repoName, repoOwner, repoName)
    files.set("install.sh", Buffer.from(installScript, "utf-8"))

    // 4. Inject the GitHub Actions release workflow
    files.set(".github/workflows/release.yml", Buffer.from(RELEASE_WORKFLOW, "utf-8"))

    // 5. Push all files as a new commit on top of the last known commit
    //    Note: bot token needs `workflow` scope to write .github/workflows/ files
    const commitSha = await pushCommit(
      repoOwner,
      repoName,
      files,
      cli.last_commit_sha,
      `release: v${version}`
    )

    // 6. Create the tag — this is the push event that triggers the Actions workflow
    const octokit = new Octokit({ auth: botToken() })
    await octokit.git.createRef({
      owner: repoOwner,
      repo: repoName,
      ref: `refs/tags/v${version}`,
      sha: commitSha,
    })

    const releaseUrl = `https://github.com/${repoOwner}/${repoName}/releases/tag/v${version}`

    // 7. Persist — release_status stays in_progress until GitHub Actions finishes.
    //    The frontend polls /api/releases/status and calls PATCH here when complete.
    await supabase
      .from("clis")
      .update({
        release_status: "in_progress",
        release_error: null,
        latest_release_version: version,
        latest_release_url: releaseUrl,
        latest_release_at: new Date().toISOString(),
        homebrew_formula_url: null,
        builds_since_release: 0,
        last_commit_sha: commitSha,
      })
      .eq("id", id)

    return Response.json({ ok: true, version, releaseUrl, repoOwner, repoName, commitSha })
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

// Called by the frontend when GitHub Actions completes (success or failure).
// Updates the DB release_status so subsequent page loads show the correct state.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as { conclusion: "success" | "failure"; runUrl?: string }
  const { conclusion, runUrl } = body

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
    .select("id, provider_id")
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (conclusion === "success") {
    await supabase
      .from("clis")
      .update({ release_status: "completed", release_error: null })
      .eq("id", id)
  } else {
    await supabase
      .from("clis")
      .update({
        release_status: "failed",
        release_error: runUrl
          ? `GitHub Actions build failed. View logs: ${runUrl}`
          : "GitHub Actions build failed",
      })
      .eq("id", id)
  }

  return Response.json({ ok: true })
}
