import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { authenticateRequest } from '@/lib/mobile-auth'

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { success: false, isRecommended: false },
        { status: 400, headers: corsHeaders }
      )
    }

    // Try mobile auth first, then fall back to session auth
    const { user: mobileUser } = await authenticateRequest(request)
    const session = mobileUser ? null : await auth()
    const userId = mobileUser?.id || session?.user?.id

    if (!userId) {
      return NextResponse.json({
        success: true,
        isRecommended: false
      }, { headers: corsHeaders })
    }

    const existingLike = await prisma.novelLike.findUnique({
      where: {
        userId_novelId: {
          userId,
          novelId
        }
      }
    })

    return NextResponse.json({
      success: true,
      isRecommended: !!existingLike
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Recommend status API error:', error)
    return NextResponse.json(
      { success: false, isRecommended: false },
      { status: 500, headers: corsHeaders }
    )
  }
}
