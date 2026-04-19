import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db/client"
import { providers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { CopyButton } from "@/components/dashboard/copy-button"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.email, session.user.email))
    .limit(1)

  if (!provider) redirect("/")

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-1 text-sm">Account and provider details</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name</span>
              <span>{provider.name ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email</span>
              <span>{provider.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Member since</span>
              <span>
                {provider.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium">Provider ID</h2>
          <p className="text-xs text-muted-foreground">
            Your unique identifier on the CLICreator platform.
          </p>
          <div className="flex items-center justify-between gap-3 bg-muted rounded-md px-3 py-2">
            <code className="text-xs font-mono text-muted-foreground truncate">{provider.id}</code>
            <CopyButton value={provider.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
