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

  // ✅ 移除 pages 配置，避免自动重定向到登录页面
  // 所有登录都通过 AuthModal 进行，不需要独立的登录页面

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
      // ✅ 彻底修复：提取路径部分，拼接到baseUrl
      // 问题：预览环境的callbackUrl域名与生产环境不同，导致被拒绝
      // 解决：提取路径+查询+hash，拼接到当前baseUrl

      // 1. 如果是相对路径，直接拼接baseUrl
      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`
        return fullUrl
      }

      // 2. 如果是完整URL，提取路径部分并拼接到baseUrl
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(baseUrl)

        // ✅ 同源：直接返回完整URL
        if (urlObj.origin === baseUrlObj.origin) {
          return url
        }

        // ✅ 不同源：提取路径、查询参数、hash，拼接到baseUrl
        // 例如：url = https://preview.vercel.app/novels/my-novel
        //      baseUrl = https://butternovel.com
        //      返回 = https://butternovel.com/novels/my-novel
        const path = urlObj.pathname + urlObj.search + urlObj.hash
        const redirectUrl = `${baseUrl}${path}`

        return redirectUrl
      } catch (error) {
        // URL解析失败，回退到baseUrl
        return baseUrl
      }
    },

    async signIn({ user, account }) {
      if (!user.email) {
        return false
      }

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // ⚠️ CRITICAL: Sanitize name - replace "butterpicks" (reserved for official accounts)
          let sanitizedName = user.name || "User"
          const normalizedName = sanitizedName.toLowerCase()
          if (normalizedName === 'butterpicks' || normalizedName.includes('butterpicks')) {
            // Extract email username or use "User" + random number
            const emailUsername = user.email.split('@')[0]
            sanitizedName = emailUsername.replace(/[^a-zA-Z0-9]/g, '_') || `User${Math.floor(Math.random() * 10000)}`
          }

          await prisma.user.create({
            data: {
              email: user.email,
              name: sanitizedName,
              avatar: user.image || null,
              googleId: account?.providerAccountId || null,
            },
          })
        } else {
          // Update Google ID and avatar if signing in with Google
          if (account?.provider === 'google') {
            const updateData: any = {}

            // Link Google ID if not already linked
            if (!existingUser.googleId && account.providerAccountId) {
              updateData.googleId = account.providerAccountId
            }

            // Update avatar from Google if user doesn't have a custom avatar
            // or if they haven't uploaded their own avatar yet
            if (user.image) {
              // Check if current avatar is from Google (contains googleusercontent.com)
              // or if user has no avatar
              const currentAvatar = (existingUser as any).avatar
              const isGoogleAvatar = currentAvatar?.includes('googleusercontent.com')
              const hasNoAvatar = !currentAvatar

              if (hasNoAvatar || isGoogleAvatar) {
                updateData.avatar = user.image
              }
            }

            // Perform update if there are changes
            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { email: user.email },
                data: updateData,
              })
            }
          }
        }

        return true
      } catch (error) {
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
          }
        } catch (error) {
          // Silent error handling
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
      }
      return session
    },
  },

  debug: process.env.NODE_ENV === 'development',
})
