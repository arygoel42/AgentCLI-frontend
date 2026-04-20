"use server"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { generateApiKey, hashApiKey, getApiKeyHint } from "@/lib/crypto"

async function getProviderBySession() {
  const session = await auth()
  if (!session?.user?.email) return null
  const supabase = await createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select()
    .eq("email", session.user.email)
    .limit(1)
    .single()
  return provider ?? null
}

// First-time key creation — returns plaintext once
export async function createApiKey(): Promise<{ key: string }> {
  const provider = await getProviderBySession()
  if (!provider) throw new Error("Unauthorized")
  if (provider.api_key_hash) throw new Error("Key already exists — use rotate instead")

  const key = generateApiKey()
  const supabase = await createClient()
  await supabase
    .from("providers")
    .update({ api_key_hash: hashApiKey(key), api_key_hint: getApiKeyHint(key) })
    .eq("id", provider.id)

  return { key }
}

// Rotate existing key — invalidates old one immediately, returns new plaintext once
export async function rotateApiKey(): Promise<{ key: string }> {
  const provider = await getProviderBySession()
  if (!provider) throw new Error("Unauthorized")

  const key = generateApiKey()
  const supabase = await createClient()
  await supabase
    .from("providers")
    .update({ api_key_hash: hashApiKey(key), api_key_hint: getApiKeyHint(key) })
    .eq("id", provider.id)

  return { key }
}
