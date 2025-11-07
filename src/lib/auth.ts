// src/lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  
  pages: {
    signIn: "/auth/login",
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
      }
    }),
    
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
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
            name: user.name || null,
            image: user.avatar || null,
          }
        } catch (error) {
          console.error("Authorize error:", error)
          return null
        }
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false
      
      try {
        if (account?.provider === "google") {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "User",
                avatar: user.image || null,
                googleId: account.providerAccountId,
              },
            })
          } else if (!existingUser.googleId) {
            await prisma.user.update({
              where: { email: user.email },
              data: { googleId: account.providerAccountId },
            })
          }
        }
        
        return true
      } catch (error) {
        console.error("SignIn callback error:", error)
        return false
      }
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email!
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email!
        session.user.name = token.name || ""
        session.user.image = token.picture as string || ""
      }
      return session
    },
  },
  
  debug: true,
})