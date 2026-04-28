"use server"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callPreview } from "@/lib/engine"
import { generateYml } from "@/lib/generate-yml"
import { repoExists, validateRepoName } from "@/lib/github"
import { randomUUID } from "crypto"

// createProject does only the fast work: parse spec, generate default yml,
// insert a clis row with provisioning_status='pending'. The slow GitHub work
// (build → repo → invite) is fired separately by the client via
// POST /api/projects/[id]/provision so the user lands in the studio quickly.
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

  // Fail fast on name collisions before anyone leaves the dashboard.
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

  // Build IR + default yml. Fast (just parser + template-driven serialization).
  const previewData = await callPreview(specContent, specFilename)
  const configYml = generateYml(previewData.api)

  const envPrefix = projectName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()
  const telemetryToken = randomUUID()

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
      provisioning_status: "pending",
    })
    .select("id")
    .single()

  if (error || !inserted) throw new Error(error?.message ?? "Failed to create project")

  return { id: inserted.id }
}
