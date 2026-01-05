// src/app/api/mobile/auth/google/route.ts
// Google OAuth for mobile app - creates/finds user and returns JWT
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, displayName, photoUrl, googleId } = body

    console.log('[Mobile Google Auth] Auth attempt for:', email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find existing user by email or googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(googleId ? [{ googleId }] : [])
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        googleId: true,
      }
    })

    if (user) {
      console.log('[Mobile Google Auth] Existing user found:', user.id)

      // Update googleId if not set
      if (!user.googleId && googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            bio: true,
            googleId: true,
          }
        })
      }

      // Update avatar if user doesn't have one
      if (!user.avatar && photoUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: photoUrl },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            bio: true,
            googleId: true,
          }
        })
      }
    } else {
      // Create new user
      console.log('[Mobile Google Auth] Creating new user for:', email)

      // Check if username is taken
      let username = displayName || email.split('@')[0]
      const existingUsername = await prisma.user.findFirst({
        where: { name: username }
      })
      if (existingUsername) {
        // Add random suffix to make unique
        username = `${username}_${Date.now().toString().slice(-4)}`
      }

      user = await prisma.user.create({
        data: {
          email,
          name: username,
          avatar: photoUrl,
          googleId: googleId,
          // No password for Google users
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          bio: true,
          googleId: true,
        }
      })
      console.log('[Mobile Google Auth] User created:', user.id)
    }

    // Create JWT token
    console.log('[Mobile Google Auth] Creating JWT for user:', user.id)
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.avatar,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    console.log('[Mobile Google Auth] JWT created, length:', token.length)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Mobile Google Auth] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
