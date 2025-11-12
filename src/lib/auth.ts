// src/lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
// ✅ 使用统一的 Prisma 实例（包含连接池配置）
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
  
  pages: {
    signIn: "/auth/login",  // ✅ 改成登录页
    error: "/",
  },
  
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
      // 修复 PKCE 错误：使用 state 检查而不是 PKCE
      checks: ["state"],
    }),
  ],
  
  callbacks: {
    // ✅ 添加 redirect callback
    async redirect({ url, baseUrl }) {
      // 如果 url 是相对路径,返回完整 URL
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // 如果 url 在同一域名下,返回
      else if (new URL(url).origin === baseUrl) return url
      // 返回原始 url 而不是 baseUrl，这样登录后会跳回原来的页面
      return url
    },
    
    async signIn({ user, account }) {
      if (!user.email) {
        console.error('❌ No email in user object')
        return false
      }
      
      try {
        console.log('✅ Attempting Google sign in for:', user.email)
        
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          console.log('📝 Creating new user...')
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "User",
              avatar: user.image || null,
              googleId: account?.providerAccountId || null,
            },
          })
          console.log('✅ User created successfully')
        } else {
          console.log('✅ Existing user found:', existingUser.id)
          
          if (!existingUser.googleId && account?.providerAccountId) {
            console.log('📝 Linking Google account...')
            await prisma.user.update({
              where: { email: user.email },
              data: { googleId: account.providerAccountId },
            })
            console.log('✅ Google account linked')
          }
        }
        
        return true
      } catch (error) {
        console.error('❌ SignIn callback error:', error)
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        return true
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
            console.log('✅ JWT token updated with DB user id:', dbUser.id)
          } else {
            console.error('❌ User not found in database for email:', user?.email || token.email)
          }
        } catch (error) {
          console.error('❌ Error fetching user in jwt callback:', error)
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
        console.log('✅ Session created with user id:', session.user.id)
      }
      return session
    },
  },
  
  debug: true,
})