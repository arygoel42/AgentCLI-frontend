import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProjectsEmptyState } from "@/components/dashboard/projects-empty-state"
import { ProjectsList } from "@/components/dashboard/projects-list"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) redirect("/")

  const { data: clis } = await supabase
    .from("clis")
    .select("id, name, module_path, current_version, created_at")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })

  const hasProjects = (clis?.length ?? 0) > 0

  return (
    <div className="p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {hasProjects
              ? "Manage your CLIs"
              : "Spin up your first CLI from an OpenAPI spec"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        {hasProjects ? (
          <ProjectsList clis={clis!} />
        ) : (
          <ProjectsEmptyState />
        )}
      </div>
    </div>
  )
}
