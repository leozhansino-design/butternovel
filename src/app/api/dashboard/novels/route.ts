import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'

// GET - List all novels by the current author
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const novels = await prisma.novel.findMany({
      where: {
        authorId: session.user.email,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        chapters: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const formattedNovels = novels.map((novel) => ({
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      coverImage: novel.coverImage,
      blurb: novel.blurb,
      status: novel.status,
      isPublished: novel.isPublished,
      isDraft: novel.isDraft,
      categoryName: novel.category.name,
      totalChapters: novel.chapters.length,
      viewCount: novel.viewCount,
      likeCount: novel.likeCount,
      commentCount: novel.commentCount,
      averageRating: novel.averageRating,
      totalRatings: novel.totalRatings,
      createdAt: novel.createdAt,
      updatedAt: novel.updatedAt,
    }))

    return NextResponse.json({ novels: formattedNovels })
  } catch (error) {
    console.error('[Dashboard Novels API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch novels' },
      { status: 500 }
    )
  }
}

// POST - Create a new novel
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, coverImage, categoryId, blurb, status, isPublished, chapters } = body

    // Validate required fields
    if (!title || !coverImage || !categoryId || !blurb) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (title.length > 120) {
      return NextResponse.json(
        { error: 'Title must be 120 characters or less' },
        { status: 400 }
      )
    }

    if (blurb.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Upload cover image to Cloudinary
    let coverImageUrl = ''
    let coverImagePublicId = ''

    if (coverImage.startsWith('data:image')) {
      const uploadResult = await cloudinary.uploader.upload(coverImage, {
        folder: 'butternovel/covers',
        transformation: [
          { width: 300, height: 400, crop: 'fill' },
        ],
      })
      coverImageUrl = uploadResult.secure_url
      coverImagePublicId = uploadResult.public_id
    } else {
      coverImageUrl = coverImage
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now()

    // Calculate total word count
    const totalWordCount = chapters?.reduce((sum: number, ch: any) => {
      const words = ch.content.trim().split(/\s+/).filter((w: string) => w).length
      return sum + words
    }, 0) || 0

    // Create novel with chapters
    const novel = await prisma.novel.create({
      data: {
        title,
        slug,
        coverImage: coverImageUrl,
        coverImagePublicId,
        blurb,
        authorId: session.user.email,
        authorName: session.user.name || 'Anonymous Author',
        categoryId: parseInt(categoryId),
        status: status || 'ONGOING',
        isPublished: isPublished || false,
        isDraft: !isPublished,
        totalChapters: chapters?.length || 0,
        wordCount: totalWordCount,
        chapters: chapters
          ? {
              create: chapters.map((ch: any, index: number) => ({
                chapterNumber: index + 1,
                title: ch.title,
                slug: `${slug}-chapter-${index + 1}`,
                content: ch.content,
                wordCount: ch.content.trim().split(/\s+/).filter((w: string) => w).length,
                isPublished: isPublished || false,
              })),
            }
          : undefined,
      },
      include: {
        chapters: true,
      },
    })

    return NextResponse.json({
      message: 'Novel created successfully',
      novel,
    })
  } catch (error) {
    console.error('[Dashboard Novels API] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create novel' },
      { status: 500 }
    )
  }
}
