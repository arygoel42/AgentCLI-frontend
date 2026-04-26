import NextAuth from "next-auth"
// import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { createClient } from "@/utils/supabase/server"

type GitHubProfile = {
  login?: string
  id?: number | string
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Google({
    //   clientId: process.env.AUTH_GOOGLE_ID,
    //   clientSecret: process.env.AUTH_GOOGLE_SECRET,
    // }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      const githubProfile = (account?.provider === "github" ? (profile as GitHubProfile) : null) ?? null
      const githubUsername = githubProfile?.login ?? null
      const githubUserId = githubProfile?.id != null ? String(githubProfile.id) : null

      console.log("[auth] signIn callback fired for:", user.email, "gh:", githubUsername)
      const supabase = createClient()
      const { data: existing, error: selectError } = await supabase
        .from("providers")
        .select("id, github_username")
        .eq("email", user.email)
        .limit(1)

      if (selectError) console.error("[auth] signIn select error:", selectError)

      if (!existing || existing.length === 0) {
        const { error: insertError } = await supabase.from("providers").insert({
          email: user.email,
          name: user.name ?? null,
          avatar_url: user.image ?? null,
          github_username: githubUsername,
          github_user_id: githubUserId,
        })
        if (insertError) console.error("[auth] signIn insert error:", insertError)
      } else if (githubUsername && existing[0].github_username !== githubUsername) {
        const { error: updateError } = await supabase
          .from("providers")
          .update({ github_username: githubUsername, github_user_id: githubUserId })
          .eq("email", user.email)
        if (updateError) console.error("[auth] signIn update error:", updateError)
      }

      return true
    },

    async session({ session }) {
      if (!session.user?.email) return session

      try {
        const supabase = createClient()
        const { data: provider } = await supabase
          .from("providers")
          .select("id, github_username")
          .eq("email", session.user.email)
          .limit(1)
          .single()

        if (provider) {
          // @ts-expect-error — extending session type
          session.user.providerId = provider.id
          // @ts-expect-error — extending session type
          session.user.githubUsername = provider.github_username
        }
      } catch (err) {
        console.error("[auth] session Supabase error:", err)
      }

      return session
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      if (isOnDashboard) return isLoggedIn
      return true
    },
  },
})
