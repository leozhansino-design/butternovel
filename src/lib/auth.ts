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

      console.log('[Auth] Redirect callback:', { url, baseUrl })

      // 1. 如果是相对路径，直接拼接baseUrl
      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`
        console.log('[Auth] Redirecting to relative path:', fullUrl)
        return fullUrl
      }

      // 2. 如果是完整URL，提取路径部分并拼接到baseUrl
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(baseUrl)

        // ✅ 同源：直接返回完整URL
        if (urlObj.origin === baseUrlObj.origin) {
          console.log('[Auth] Same origin, redirecting to:', url)
          return url
        }

        // ✅ 不同源：提取路径、查询参数、hash，拼接到baseUrl
        // 例如：url = https://preview.vercel.app/novels/my-novel
        //      baseUrl = https://butternovel.com
        //      返回 = https://butternovel.com/novels/my-novel
        const path = urlObj.pathname + urlObj.search + urlObj.hash
        const redirectUrl = `${baseUrl}${path}`

        console.log('[Auth] Different origin detected:')
        console.log('  - Original URL:', url)
        console.log('  - Extracted path:', path)
        console.log('  - Redirecting to:', redirectUrl)

        return redirectUrl
      } catch (error) {
        // URL解析失败，回退到baseUrl
        console.error(`[Auth] Invalid redirect URL: ${url}, error:`, error)
        return baseUrl
      }
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
          console.log('[Auth] Google user data:', {
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
            isGoogleProvider: account?.provider === 'google'
          })

          // ⚠️ CRITICAL: Sanitize name - replace "butterpicks" (reserved for official accounts)
          let sanitizedName = user.name || "User"
          const normalizedName = sanitizedName.toLowerCase()
          if (normalizedName === 'butterpicks' || normalizedName.includes('butterpicks')) {
            // Extract email username or use "User" + random number
            const emailUsername = user.email.split('@')[0]
            sanitizedName = emailUsername.replace(/[^a-zA-Z0-9]/g, '_') || `User${Math.floor(Math.random() * 10000)}`
            console.log('[Auth] Reserved name detected, replaced with:', sanitizedName)
          }

          await prisma.user.create({
            data: {
              email: user.email,
              name: sanitizedName,
              avatar: user.image || null,
              googleId: account?.providerAccountId || null,
            },
          })
          console.log('[Auth] User account created successfully with avatar:', user.image)
        } else {
          console.log('[Auth] Existing user found:', existingUser.id)

          // Update Google ID and avatar if signing in with Google
          if (account?.provider === 'google') {
            const updateData: any = {}

            // Link Google ID if not already linked
            if (!existingUser.googleId && account.providerAccountId) {
              updateData.googleId = account.providerAccountId
              console.log('[Auth] Linking Google OAuth account')
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
                console.log('[Auth] Updating Google avatar:', user.image)
              }
            }

            // Perform update if there are changes
            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { email: user.email },
                data: updateData,
              })
              console.log('[Auth] Updated user with Google data:', updateData)
            }
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
