// src/lib/auth.ts - 简化版,排除所有可能的错误源
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"

// ⭐ 全局单例 Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// ⭐ 验证必需的环境变量
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
}

// 检查缺失的环境变量
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ⭐ Vercel 部署必需
  trustHost: true,
  
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  
  pages: {
    signIn: "/",
    error: "/",
  },
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      // ⭐ 简化版 - 先确保基本登录能用
      if (!user.email) {
        console.error('❌ No email in user object')
        return false
      }
      
      // ⭐ 用 try-catch 包裹所有数据库操作
      try {
        console.log('✅ Attempting Google sign in for:', user.email)
        
        // 检查用户是否存在
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // 创建新用户
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
          console.log('✅ Existing user found')
          
          // 如果用户存在但没有 googleId,添加它
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
        // ⭐ 详细的错误日志
        console.error('❌ SignIn callback error:', error)
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        
        // ⭐ 即使数据库失败,也返回 true 让用户能登录
        // 这样可以先验证 OAuth 流程是否正常
        return true
      }
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email!
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  
  // ⭐ 生产环境也开启 debug,帮助排查问题
  debug: true,
})