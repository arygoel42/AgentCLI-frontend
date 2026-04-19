import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db/client"
import { providers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ApiKeyManager } from "@/components/dashboard/api-key-manager"

export default async function ApiKeyPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const [provider] = await db
    .select({ apiKeyHash: providers.apiKeyHash, apiKeyHint: providers.apiKeyHint })
    .from(providers)
    .where(eq(providers.email, session.user.email))
    .limit(1)

  if (!provider) redirect("/")

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">API Key</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Authenticate programmatic access to the petl API.
      </p>

      <div className="mt-8">
        <ApiKeyManager
          hasKey={!!provider.apiKeyHash}
          hint={provider.apiKeyHint}
        />
      </div>
    </div>
  )
}
