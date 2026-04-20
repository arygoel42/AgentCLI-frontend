"use server"

import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export type OnboardingAnswers = {
  role: string
  company: string | null
  useCase: string
  referralSource: string | null
}

export async function completeOnboarding(answers: OnboardingAnswers) {
  const session = await auth()
  if (!session?.user?.email) throw new Error("Unauthorized")

  const supabase = createClient()
  const { error } = await supabase
    .from("providers")
    .update({
      role: answers.role,
      company: answers.company,
      use_case: answers.useCase,
      referral_source: answers.referralSource,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("email", session.user.email)

  if (error) throw new Error(error.message)

  redirect("/dashboard")
}
