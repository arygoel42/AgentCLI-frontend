import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="text-muted-foreground mt-1">
        Welcome back, {session.user.name}
      </p>
      <div className="mt-8 rounded-lg border border-border p-6 text-sm text-muted-foreground">
        No CLIs yet. Head to <span className="text-foreground font-medium">My CLIs</span> to create your first one.
      </div>
    </div>
  )
}
