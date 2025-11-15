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

    // Fetch reading history
    const historyEntries = await prisma.readingHistory.findMany({
      where: { userId },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            authorName: true,
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
        lastReadAt: 'desc'
      }
    })

    const novels = historyEntries.map(entry => ({
      id: entry.novel.id,
      title: entry.novel.title,
      slug: entry.novel.slug,
      coverImage: entry.novel.coverImage,
      authorName: entry.novel.authorName,
      status: entry.novel.status,
      totalChapters: entry.novel.totalChapters,
      categoryName: entry.novel.category.name,
      lastReadAt: entry.lastReadAt.toISOString()
    }))

    return NextResponse.json({ novels })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
