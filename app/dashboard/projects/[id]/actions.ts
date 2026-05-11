"use server"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callPreview } from "@/lib/engine"
import { mergeSpecIntoConfig } from "@/lib/merge-spec"

async function getOwnedCli(cliId: string) {
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

  const { data: cli } = await supabase
    .from("clis")
    .select("id, provider_id")
    .eq("id", cliId)
    .single()

  if (!cli || cli.provider_id !== provider.id) throw new Error("Not found")

  return { supabase, providerId: provider.id }
}

export async function deleteProject(cliId: string): Promise<void> {
  const { supabase } = await getOwnedCli(cliId)
  const { error } = await supabase.from("clis").delete().eq("id", cliId)
  if (error) throw new Error(error.message)
}

export async function saveConfig(cliId: string, configYml: string): Promise<void> {
  const { supabase } = await getOwnedCli(cliId)

  const { error } = await supabase
    .from("clis")
    .update({ config_yml: configYml })
    .eq("id", cliId)

  if (error) throw new Error(error.message)
}

export async function saveSkillNotes(cliId: string, notes: string): Promise<void> {
  const { supabase } = await getOwnedCli(cliId)

  const { error } = await supabase
    .from("clis")
    .update({ skill_notes: notes })
    .eq("id", cliId)

  if (error) throw new Error(error.message)
}

export async function saveDataSettings(
  cliId: string,
  settings: { telemetryEnabled: boolean; feedbackEnabled: boolean }
): Promise<void> {
  const { supabase } = await getOwnedCli(cliId)

  const { error } = await supabase
    .from("clis")
    .update({
      telemetry_enabled: settings.telemetryEnabled,
      feedback_enabled: settings.feedbackEnabled,
    })
    .eq("id", cliId)

  if (error) throw new Error(error.message)
}

export async function updateSpec(cliId: string, formData: FormData): Promise<void> {
  const { supabase } = await getOwnedCli(cliId)

  const specFile = formData.get("specFile") as File | null
  const specUrl = (formData.get("specUrl") as string | null)?.trim()

  let specContent: string
  let specFilename: string

  if (specFile && specFile.size > 0) {
    specContent = await specFile.text()
    specFilename = specFile.name
  } else if (specUrl) {
    const res = await fetch(specUrl)
    if (!res.ok) throw new Error(`Failed to fetch spec: ${res.statusText}`)
    specContent = await res.text()
    const urlPath = new URL(specUrl).pathname
    const lastSegment = urlPath.split("/").filter(Boolean).pop() ?? "openapi"
    specFilename = lastSegment.includes(".") ? lastSegment : `${lastSegment}.yaml`
  } else {
    throw new Error("Provide a spec file or URL")
  }

  const { data: cli } = await supabase
    .from("clis")
    .select("config_yml")
    .eq("id", cliId)
    .single()

  const newPreview = await callPreview(specContent, specFilename)
  const mergedYml = mergeSpecIntoConfig(newPreview.api, cli?.config_yml ?? "")

  const { error } = await supabase
    .from("clis")
    .update({
      spec_content: specContent,
      spec_filename: specFilename,
      config_yml: mergedYml,
      preview_json: JSON.stringify(newPreview),
    })
    .eq("id", cliId)

  if (error) throw new Error(error.message)
}
