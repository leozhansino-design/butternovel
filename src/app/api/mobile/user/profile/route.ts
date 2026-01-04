// Update user profile API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/mobile-auth'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { name, avatar } = body

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters' },
          { status: 400, headers: corsHeaders }
        )
      }

      // Check if name is taken by another user
      const existingName = await prisma.user.findFirst({
        where: {
          name: name.trim(),
          NOT: { id: user.id }
        }
      })

      if (existingName) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400, headers: corsHeaders }
        )
      }
    }

    // Handle avatar upload (base64 -> URL)
    let avatarUrl = undefined
    if (avatar && avatar.startsWith('data:image')) {
      // For now, store as data URL (in production, upload to S3/Cloudinary)
      // Limit size check
      if (avatar.length > 500000) {
        return NextResponse.json(
          { error: 'Avatar image too large' },
          { status: 400, headers: corsHeaders }
        )
      }
      avatarUrl = avatar
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(avatarUrl !== undefined && { avatar: avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Update Profile] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
