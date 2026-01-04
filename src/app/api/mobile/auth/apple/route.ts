// src/app/api/mobile/auth/apple/route.ts
// Apple Sign-In for mobile app - creates/finds user and returns JWT
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
    const { email, fullName, appleId } = body

    console.log('[Mobile Apple Auth] Auth attempt, appleId:', appleId)

    if (!appleId) {
      return NextResponse.json(
        { error: 'Apple ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find existing user by appleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleId },
          ...(email ? [{ email }] : [])
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        appleId: true,
      }
    })

    if (user) {
      console.log('[Mobile Apple Auth] Existing user found:', user.id)

      // Update appleId if not set
      if (!user.appleId && appleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { appleId },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            appleId: true,
          }
        })
      }
    } else {
      // Create new user
      console.log('[Mobile Apple Auth] Creating new user')

      // Generate username from fullName or appleId
      let username = fullName || `apple_user_${Date.now().toString().slice(-6)}`

      // Check if username is taken
      const existingUsername = await prisma.user.findFirst({
        where: { name: username }
      })
      if (existingUsername) {
        username = `${username}_${Date.now().toString().slice(-4)}`
      }

      // Apple may not provide email on subsequent logins, so email can be null
      user = await prisma.user.create({
        data: {
          email: email || null,
          name: username,
          appleId: appleId,
          // No password for Apple users
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          appleId: true,
        }
      })
      console.log('[Mobile Apple Auth] User created:', user.id)
    }

    // Create JWT token
    console.log('[Mobile Apple Auth] Creating JWT for user:', user.id)
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

    console.log('[Mobile Apple Auth] JWT created, length:', token.length)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Mobile Apple Auth] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
