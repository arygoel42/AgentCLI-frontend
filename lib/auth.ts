import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { createClient } from "@/utils/supabase/server"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false

      const supabase = createClient()
      const { data: existing } = await supabase
        .from("providers")
        .select("id")
        .eq("email", user.email)
        .limit(1)

      if (!existing || existing.length === 0) {
        await supabase.from("providers").insert({
          email: user.email,
          name: user.name ?? null,
          avatar_url: user.image ?? null,
        })
      }

      return true
    },

    async session({ session }) {
      if (!session.user?.email) return session

      const supabase = createClient()
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("email", session.user.email)
        .limit(1)
        .single()

      if (provider) {
        // @ts-expect-error — extending session type
        session.user.providerId = provider.id
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
