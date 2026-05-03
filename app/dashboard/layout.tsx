import { TopBar } from "@/components/dashboard/top-bar"
import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("name, email, created_at, onboarding_completed_at, avatar_url")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider?.onboarding_completed_at) redirect("/onboarding")

  return (
    <div className="bg-background">
      <TopBar provider={{ name: provider.name, email: provider.email, created_at: provider.created_at, avatarUrl: provider.avatar_url ?? null }} />
      <main>
        {children}
      </main>
    </div>
  )
}
