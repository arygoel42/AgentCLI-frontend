"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db/client"
import { providers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { generateApiKey, hashApiKey, getApiKeyHint } from "@/lib/crypto"

async function getProviderBySession() {
  const session = await auth()
  if (!session?.user?.email) return null
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.email, session.user.email))
    .limit(1)
  return provider ?? null
}

// First-time key creation — returns plaintext once
export async function createApiKey(): Promise<{ key: string }> {
  const provider = await getProviderBySession()
  if (!provider) throw new Error("Unauthorized")
  if (provider.apiKeyHash) throw new Error("Key already exists — use rotate instead")

  const key = generateApiKey()
  await db
    .update(providers)
    .set({ apiKeyHash: hashApiKey(key), apiKeyHint: getApiKeyHint(key) })
    .where(eq(providers.id, provider.id))

  return { key }
}

// Rotate existing key — invalidates old one immediately, returns new plaintext once
export async function rotateApiKey(): Promise<{ key: string }> {
  const provider = await getProviderBySession()
  if (!provider) throw new Error("Unauthorized")

  const key = generateApiKey()
  await db
    .update(providers)
    .set({ apiKeyHash: hashApiKey(key), apiKeyHint: getApiKeyHint(key) })
    .where(eq(providers.id, provider.id))

  return { key }
}
