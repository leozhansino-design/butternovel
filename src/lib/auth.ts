// src/lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
}

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  // ✅ Remove custom pages config to prevent redirect to /auth/login
  // This allows Google OAuth to work directly from AuthModal without intermediate redirect
  // The /auth/login page can still be accessed directly via URL if needed

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      checks: ["state"],
    }),

    // ✅ Credentials Provider for email/username + password login
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Please enter your email or username and password")
        }

        const identifier = credentials.identifier as string
        const password = credentials.password as string

        // Find user by email OR username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { name: identifier }
            ]
          }
        })

        if (!user) {
          throw new Error("No account found with this email or username")
        }

        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please use 'Continue with Google'")
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          throw new Error("Incorrect password. Please try again")
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar
        }
      }
    })
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      // 返回原始 url 而不是 baseUrl，这样登录后会跳回原来的页面
      return url
    },

    async signIn({ user, account }) {
      if (!user.email) {
        console.error('[Auth] No email provided')
        return false
      }

      try {
        console.log('[Auth] Processing sign-in for:', user.email)

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          console.log('[Auth] Creating new user account')
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "User",
              avatar: user.image || null,
              googleId: account?.providerAccountId || null,
            },
          })
          console.log('[Auth] User account created successfully')
        } else {
          console.log('[Auth] User found:', existingUser.id)

          if (!existingUser.googleId && account?.providerAccountId) {
            console.log('[Auth] Linking Google OAuth account')
            await prisma.user.update({
              where: { email: user.email },
              data: { googleId: account.providerAccountId },
            })
            console.log('[Auth] Google account linked')
          }
        }

        return true
      } catch (error) {
        console.error('[Auth] Sign-in error:', error)
        console.error('[Auth] Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
        })
        // Return false to prevent sign-in and show error page
        return false
      }
    },

    async jwt({ token, user, trigger }) {
      if (user?.email || trigger === "signIn" || trigger === "update") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: (user?.email || token.email) as string },
            select: { id: true, email: true, name: true, avatar: true }
          })

          if (dbUser) {
            token.id = dbUser.id
            token.email = dbUser.email
            token.name = dbUser.name
            token.picture = dbUser.avatar
            console.log('[Auth] JWT token updated for user:', dbUser.id)
          } else {
            console.error('[Auth] User not found:', user?.email || token.email)
          }
        } catch (error) {
          console.error('[Auth] JWT callback error:', error)
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        console.log('[Auth] Session created for:', session.user.id)
      }
      return session
    },
  },

  debug: process.env.NODE_ENV === 'development',
})
