import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingForm } from "./onboarding-form"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("onboarding_completed_at, name")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) redirect("/")
  if (provider.onboarding_completed_at) redirect("/dashboard")

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <OnboardingForm firstName={provider.name?.split(" ")[0] ?? null} />
    </main>
  )
}
