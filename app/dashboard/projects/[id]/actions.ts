"use server"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

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
