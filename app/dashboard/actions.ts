"use server"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callBuild, callPreview } from "@/lib/engine"
import { generateYml } from "@/lib/generate-yml"
import {
  createStagingRepo,
  inviteCollaborator,
  pushInitialCommit,
  repoExists,
  validateRepoName,
} from "@/lib/github"
import { randomUUID } from "crypto"
import AdmZip from "adm-zip"

export async function createProject(formData: FormData): Promise<{ id: string }> {
  const session = await auth()
  if (!session?.user?.email) throw new Error("Not authenticated")

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("id, github_username")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) throw new Error("Provider not found")

  const projectName = (formData.get("projectName") as string | null)?.trim() ?? ""
  const nameError = validateRepoName(projectName)
  if (nameError) throw new Error(nameError)

  const specFile = formData.get("specFile") as File | null
  const specUrl = (formData.get("specUrl") as string | null)?.trim()

  let specContent: string
  let specFilename: string

  if (specFile && specFile.size > 0) {
    specContent = await specFile.text()
    specFilename = specFile.name
  } else if (specUrl) {
    const res = await fetch(specUrl)
    if (!res.ok) throw new Error(`Failed to fetch spec from URL: ${res.statusText}`)
    specContent = await res.text()
    const urlPath = new URL(specUrl).pathname
    const lastSegment = urlPath.split("/").filter(Boolean).pop() ?? "openapi"
    specFilename = lastSegment.includes(".") ? lastSegment : `${lastSegment}.yaml`
  } else {
    throw new Error("Please provide a spec file or URL")
  }

  // Uniqueness check: DB + GitHub
  const { data: nameTakenInDb } = await supabase
    .from("clis")
    .select("id")
    .eq("name", projectName)
    .limit(1)
  if (nameTakenInDb && nameTakenInDb.length > 0) {
    throw new Error(`Project name "${projectName}" is already taken`)
  }
  if (await repoExists(projectName)) {
    throw new Error(`A repo named "${projectName}" already exists in the org`)
  }

  // Build IR + default yml
  const previewData = await callPreview(specContent, specFilename)
  const configYml = generateYml(previewData.api)

  const envPrefix = projectName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()
  const telemetryToken = randomUUID()

  // Build the source zip via the engine
  const buildRes = await callBuild(specContent, specFilename, configYml)
  const zipBuffer = Buffer.from(await buildRes.arrayBuffer())

  // Unzip and strip the top-level <cliName>/ directory the engine adds
  const zip = new AdmZip(zipBuffer)
  const files = new Map<string, Buffer>()
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    const stripped = entry.entryName.replace(/^[^/]+\//, "")
    if (!stripped) continue
    files.set(stripped, entry.getData())
  }
  // Add the clicreator.yml so it lives in the repo alongside source
  files.set("clicreator.yml", Buffer.from(configYml, "utf-8"))

  // Provision the repo. If anything past this point fails, we still create the
  // CLI row so the user has their spec/yml saved.
  let repoUrl: string | null = null
  let repoOwner: string | null = null
  let repoName: string | null = null
  let lastCommitSha: string | null = null
  let inviteSentAt: string | null = null

  try {
    const repo = await createStagingRepo(
      projectName,
      `CLI generated from ${previewData.api.name || specFilename}`
    )
    repoOwner = repo.owner
    repoName = repo.name
    repoUrl = repo.url

    const commitMsg = `init: generate CLI from ${previewData.api.name || specFilename}${
      previewData.api.version ? ` v${previewData.api.version}` : ""
    }`
    lastCommitSha = await pushInitialCommit(
      repo.owner,
      repo.name,
      files,
      commitMsg,
      repo.defaultBranch
    )

    if (provider.github_username) {
      await inviteCollaborator(repo.owner, repo.name, provider.github_username)
      inviteSentAt = new Date().toISOString()
    }
  } catch (err) {
    console.error("[createProject] repo provisioning failed:", err)
  }

  const { data: inserted, error } = await supabase
    .from("clis")
    .insert({
      provider_id: provider.id,
      name: projectName,
      env_prefix: envPrefix,
      telemetry_token: telemetryToken,
      spec_content: specContent,
      spec_filename: specFilename,
      config_yml: configYml,
      preview_json: JSON.stringify(previewData),
      repo_url: repoUrl,
      repo_owner: repoOwner,
      repo_name: repoName,
      last_commit_sha: lastCommitSha,
      invite_sent_at: inviteSentAt,
    })
    .select("id")
    .single()

  if (error || !inserted) throw new Error(error?.message ?? "Failed to create project")

  return { id: inserted.id }
}
