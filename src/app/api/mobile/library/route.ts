// src/app/api/mobile/library/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/mobile-auth'

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Get user's library (bookshelf)
export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticateRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401, headers: corsHeaders }
      )
    }

    const userId = user.id

    // Get library items with novel details
    const libraryItems = await prisma.library.findMany({
      where: { userId },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            blurb: true,
            coverImage: true,
            authorName: true,
            shortNovelGenre: true,
            readingPreview: true,
            viewCount: true,
            likeCount: true,
            wordCount: true,
            averageRating: true,
            isShortNovel: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    })

    // Filter to only short novels and format response
    const novels = libraryItems
      .filter((item: typeof libraryItems[number]) => item.novel.isShortNovel)
      .map((item: typeof libraryItems[number]) => ({
        id: item.novel.id,
        title: item.novel.title,
        slug: item.novel.slug,
        blurb: item.novel.blurb,
        coverImage: item.novel.coverImage,
        authorName: item.novel.authorName,
        shortNovelGenre: item.novel.shortNovelGenre,
        readingPreview: item.novel.readingPreview,
        viewCount: item.novel.viewCount,
        likeCount: item.novel.likeCount,
        wordCount: item.novel.wordCount,
        averageRating: item.novel.averageRating,
        category: item.novel.category,
        addedAt: item.addedAt.toISOString(),
      }))

    return NextResponse.json({
      success: true,
      novels,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Mobile Library] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch library' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST - Add to library
export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401, headers: corsHeaders }
      )
    }

    const userId = user.id
    const { novelId } = await req.json()

    if (!novelId) {
      return NextResponse.json(
        { error: 'Novel ID required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if already in library
    const existing = await prisma.library.findUnique({
      where: {
        userId_novelId: {
          userId,
          novelId: parseInt(novelId),
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already in library',
      }, { headers: corsHeaders })
    }

    // Add to library
    await prisma.library.create({
      data: {
        userId,
        novelId: parseInt(novelId),
      },
    })

    // Update bookmark count
    await prisma.novel.update({
      where: { id: parseInt(novelId) },
      data: { bookmarkCount: { increment: 1 } },
    })

    console.log(`[Mobile Library] Added novel ${novelId} to user ${userId}'s library`)

    return NextResponse.json({
      success: true,
      message: 'Added to library',
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Mobile Library] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to add to library' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE - Remove from library
export async function DELETE(req: NextRequest) {
  try {
    const { user } = await authenticateRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401, headers: corsHeaders }
      )
    }

    const userId = user.id
    const { novelId } = await req.json()

    if (!novelId) {
      return NextResponse.json(
        { error: 'Novel ID required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Remove from library
    const result = await prisma.library.deleteMany({
      where: {
        userId,
        novelId: parseInt(novelId),
      },
    })

    if (result.count > 0) {
      // Update bookmark count
      await prisma.novel.update({
        where: { id: parseInt(novelId) },
        data: { bookmarkCount: { decrement: 1 } },
      })
    }

    console.log(`[Mobile Library] Removed novel ${novelId} from user ${userId}'s library`)

    return NextResponse.json({
      success: true,
      message: 'Removed from library',
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Mobile Library] DELETE Error:', error)
    return NextResponse.json(
      { error: 'Failed to remove from library' },
      { status: 500, headers: corsHeaders }
    )
  }
}
