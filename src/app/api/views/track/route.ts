// src/app/api/views/track/route.ts
import { NextResponse } from 'next/server'
import { trackView } from '@/lib/view-tracker'
import { auth } from '@/lib/auth'

// CORS headers for mobile app access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { novelId } = await request.json()

    if (!novelId) {
      return NextResponse.json(
        { error: 'Missing novelId' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get session (can be null for guests)
    const session = await auth()

    // Get IP address and User Agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Track view (works for both authenticated users and guests)
    const result = await trackView({
      novelId: parseInt(novelId),
      userId: session?.user?.id || null,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      counted: result.counted,
      viewCount: result.viewCount,
    }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500, headers: corsHeaders }
    )
  }
}
