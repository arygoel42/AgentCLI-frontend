"use server"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callPreview } from "@/lib/engine"
import { generateYml, sanitizeName } from "@/lib/generate-yml"
import { randomUUID } from "crypto"

export async function createProject(formData: FormData): Promise<{ id: string }> {
  const session = await auth()
  if (!session?.user?.email) throw new Error("Not authenticated")

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) throw new Error("Provider not found")

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

  const previewData = await callPreview(specContent, specFilename)
  const configYml = generateYml(previewData.api)

  const cliName = sanitizeName(previewData.api.name)
  const envPrefix = cliName.replace(/-/g, "_").toUpperCase()
  const telemetryToken = randomUUID()

  const { data: inserted, error } = await supabase
    .from("clis")
    .insert({
      provider_id: provider.id,
      name: cliName,
      env_prefix: envPrefix,
      telemetry_token: telemetryToken,
      spec_content: specContent,
      spec_filename: specFilename,
      config_yml: configYml,
      preview_json: JSON.stringify(previewData),
    })
    .select("id")
    .single()

  if (error || !inserted) throw new Error(error?.message ?? "Failed to create project")

  return { id: inserted.id }
}
