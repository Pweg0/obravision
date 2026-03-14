import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@projetapro/db"
import bcrypt from "bcryptjs"
import { loginSchema } from "./validations/auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      empresaId?: string | null
      role: string
      onboardingStep: number
    }
  }

  interface User {
    empresaId?: string | null
    role?: string
    onboardingStep?: number
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // REQUIRED for credentials provider
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials)
        if (!result.success) return null

        const { email, password } = result.data
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          empresaId: user.empresaId,
          role: user.role,
          onboardingStep: user.onboardingStep,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.empresaId = user.empresaId ?? null
        token.role = (user.role as string) ?? "ENGENHEIRO"
        token.onboardingStep = (user.onboardingStep as number) ?? 0
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.empresaId = token.empresaId as string | null | undefined
      session.user.role = token.role as string
      session.user.onboardingStep = token.onboardingStep as number
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
