import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists and if their library is public
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        libraryPrivacy: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If library is private, return empty list
    if (user.libraryPrivacy) {
      return NextResponse.json({ novels: [] })
    }

    // Fetch user's library
    const libraryEntries = await prisma.library.findMany({
      where: { userId },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            status: true,
            totalChapters: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    }) as any[]

    const novels = libraryEntries.map(entry => ({
      id: entry.novel.id,
      title: entry.novel.title,
      slug: entry.novel.slug,
      coverImage: entry.novel.coverImage,
      category: entry.novel.category.name,
      status: entry.novel.status,
      totalChapters: entry.novel.totalChapters,
      addedAt: entry.addedAt.toISOString()
    }))

    return NextResponse.json({ novels })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
