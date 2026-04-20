import { Sidebar } from "@/components/dashboard/sidebar"
import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("onboarding_completed_at")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider?.onboarding_completed_at) redirect("/onboarding")

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
