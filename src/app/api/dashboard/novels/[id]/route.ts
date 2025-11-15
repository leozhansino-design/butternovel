import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'
import { invalidateNovelRelatedCache } from '@/lib/cache'
import { validateWithSchema, novelUpdateSchema } from '@/lib/validators'

// GET - Get a single novel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const novelId = parseInt(id)

    const novel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        authorId: session.user.id,
      },
      include: {
        category: true,
        chapters: {
          orderBy: {
            chapterNumber: 'asc',
          },
        },
      },
    })

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ novel })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch novel' },
      { status: 500 }
    )
  }
}

// PUT - Update a novel
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const novelId = parseInt(id)
    const body = await request.json()

    // ✅ Validate using Zod schema (validates title, blurb lengths, etc.)
    const validation = validateWithSchema(novelUpdateSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    // Check if novel belongs to this author
    const existingNovel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        authorId: session.user.id,
      },
    })

    if (!existingNovel) {
      return NextResponse.json(
        { error: 'Novel not found or unauthorized' },
        { status: 404 }
      )
    }

    // Handle cover image update if provided
    let coverImageUrl = body.coverImage || existingNovel.coverImage
    let coverImagePublicId = existingNovel.coverImagePublicId

    if (body.coverImage && body.coverImage.startsWith('data:image')) {
      // Delete old image if exists
      if (existingNovel.coverImagePublicId) {
        try {
          await cloudinary.uploader.destroy(existingNovel.coverImagePublicId)
        } catch (error) {
        }
      }

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(body.coverImage, {
        folder: 'butternovel/covers',
        transformation: [
          { width: 300, height: 400, crop: 'fill' },
        ],
      })
      coverImageUrl = uploadResult.secure_url
      coverImagePublicId = uploadResult.public_id
    }

    // Validate categoryId if provided
    let categoryId = existingNovel.categoryId
    if (body.categoryId) {
      const parsed = parseInt(body.categoryId)
      if (isNaN(parsed)) {
        return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
      }
      categoryId = parsed
    }

    // Update novel
    const updatedNovel = await prisma.novel.update({
      where: { id: novelId },
      data: {
        title: body.title || existingNovel.title,
        blurb: body.blurb || existingNovel.blurb,
        coverImage: coverImageUrl,
        coverImagePublicId,
        categoryId,
        status: body.status || existingNovel.status,
        isPublished: body.isPublished !== undefined ? body.isPublished : existingNovel.isPublished,
        isDraft: body.isPublished !== undefined ? !body.isPublished : existingNovel.isDraft,
      },
      include: {
        category: {
          select: { slug: true }
        }
      }
    })

    // ⚡ Clear cache: home page, category page, and novel detail page
    await invalidateNovelRelatedCache(updatedNovel.slug, updatedNovel.category?.slug)

    return NextResponse.json({
      message: 'Novel updated successfully',
      novel: updatedNovel,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update novel' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a novel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const novelId = parseInt(id)

    // Check if novel belongs to this author
    const existingNovel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        authorId: session.user.id,
      },
      include: {
        category: {
          select: { slug: true }
        }
      }
    })

    if (!existingNovel) {
      return NextResponse.json(
        { error: 'Novel not found or unauthorized' },
        { status: 404 }
      )
    }

    // Store slug and category slug for cache invalidation
    const novelSlug = existingNovel.slug
    const categorySlug = existingNovel.category?.slug

    // Delete cover image from Cloudinary
    if (existingNovel.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(existingNovel.coverImagePublicId)
      } catch (error) {
      }
    }

    // Delete novel (chapters will be deleted automatically due to cascade)
    await prisma.novel.delete({
      where: { id: novelId },
    })

    // ⚡ CRITICAL: Clear cache after deletion
    await invalidateNovelRelatedCache(novelSlug, categorySlug)

    return NextResponse.json({
      message: 'Novel deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete novel' },
      { status: 500 }
    )
  }
}
