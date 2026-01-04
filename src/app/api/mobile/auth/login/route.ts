// src/app/api/mobile/auth/login/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
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
    const { identifier, password } = body

    console.log('[Mobile Login] Login attempt for:', identifier)

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { name: identifier }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        password: true,
      }
    })

    console.log('[Mobile Login] User found:', user ? user.email : 'none')

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email or username' },
        { status: 401, headers: corsHeaders }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'This account uses Google sign-in. Please use Google login.' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      console.log('[Mobile Login] Invalid password for:', user.email)
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Create JWT token
    console.log('[Mobile Login] Creating JWT for user:', user.id)
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

    console.log('[Mobile Login] JWT created, length:', token.length)
    console.log('[Mobile Login] JWT preview:', token.substring(0, 50) + '...')

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
    console.error('[Mobile Login] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
