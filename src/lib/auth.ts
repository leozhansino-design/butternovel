// src/lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/", // 登录失败后跳转首页（会自动打开弹窗）
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google 或 Facebook OAuth 登录时，检查或创建用户
      if (account?.provider === "google" || account?.provider === "facebook") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (!existingUser) {
          // 创建新用户
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              avatar: user.image,
              googleId: account.provider === "google" ? account.providerAccountId : null,
              facebookId: account.provider === "facebook" ? account.providerAccountId : null,
            },
          })
        } else {
          // 更新现有用户的 OAuth ID
          const updateData: any = {}
          if (account.provider === "google" && !existingUser.googleId) {
            updateData.googleId = account.providerAccountId
          }
          if (account.provider === "facebook" && !existingUser.facebookId) {
            updateData.facebookId = account.providerAccountId
          }
          
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { email: user.email! },
              data: updateData,
            })
          }
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
      }
      
      if (trigger === "update" && session) {
        token.name = session.name
        token.picture = session.image
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})