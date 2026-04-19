import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { db } from "@/lib/db/client"
import { providers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

      const existing = await db
        .select({ id: providers.id })
        .from(providers)
        .where(eq(providers.email, user.email))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(providers).values({
          email: user.email,
          name: user.name ?? null,
          avatarUrl: user.image ?? null,
        })
      }

      return true
    },

    async session({ session }) {
      if (!session.user?.email) return session

      const [provider] = await db
        .select({ id: providers.id })
        .from(providers)
        .where(eq(providers.email, session.user.email))
        .limit(1)

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
