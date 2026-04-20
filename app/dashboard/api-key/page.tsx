import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { ApiKeyManager } from "@/components/dashboard/api-key-manager"

export default async function ApiKeyPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const supabase = await createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("api_key_hash, api_key_hint")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) redirect("/")

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">API Key</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Authenticate programmatic access to the petl API.
      </p>

      <div className="mt-8">
        <ApiKeyManager
          hasKey={!!provider.api_key_hash}
          hint={provider.api_key_hint}
        />
      </div>
    </div>
  )
}
