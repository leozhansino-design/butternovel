import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import ShortNovelReader from '@/components/shorts/ShortNovelReader'
import YouMayLike from '@/components/shorts/YouMayLike'
import { getShortNovelGenreName, estimateReadingTime, formatReadingTime } from '@/lib/short-novel'

interface Props {
  params: Promise<{ slug: string }>
}

// 获取短篇小说数据
async function getShortNovel(slug: string) {
  const novel = await withRetry(
    () => prisma.novel.findFirst({
      where: {
        slug,
        isShortNovel: true,
        isPublished: true,
        isBanned: false,
      },
      include: {
        chapters: {
          where: { isPublished: true },
          orderBy: { chapterNumber: 'asc' },
          take: 1, // 短篇小说只有一个章节
        },
        ratings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
            likes: true,
          }
        }
      }
    }),
    { operationName: 'Get short novel by slug' }
  )

  return novel
}

// 获取相关推荐短篇小说
async function getRelatedShorts(currentNovelId: number, genre: string | null) {
  const related = await withRetry(
    () => prisma.novel.findMany({
      where: {
        isShortNovel: true,
        isPublished: true,
        isBanned: false,
        id: { not: currentNovelId },
        ...(genre ? { shortNovelGenre: genre } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        blurb: true,
        shortNovelGenre: true,
        wordCount: true,
        viewCount: true,
        likeCount: true,
        averageRating: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 6,
    }),
    { operationName: 'Get related short novels' }
  )

  return related
}

// 增加浏览次数
async function incrementViewCount(novelId: number) {
  try {
    await prisma.novel.update({
      where: { id: novelId },
      data: { viewCount: { increment: 1 } },
    })
  } catch (error) {
    console.error('Failed to increment view count:', error)
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const novel = await getShortNovel(slug)

  if (!novel) {
    return {
      title: 'Short Novel Not Found',
    }
  }

  const readingTime = estimateReadingTime(novel.wordCount)
  const genreName = novel.shortNovelGenre ? getShortNovelGenreName(novel.shortNovelGenre) : ''

  return {
    title: `${novel.title} | Short Novel`,
    description: novel.blurb.substring(0, 160),
    keywords: [
      'short novel',
      'quick read',
      genreName,
      novel.title,
      'butternovel',
    ].filter(Boolean),
    openGraph: {
      title: novel.title,
      description: novel.blurb.substring(0, 160),
      type: 'article',
      url: `/shorts/${novel.slug}`,
    },
  }
}

export default async function ShortNovelPage({ params }: Props) {
  const { slug } = await params
  const novel = await getShortNovel(slug)

  if (!novel || novel.chapters.length === 0) {
    notFound()
  }

  // 获取相关推荐
  const relatedNovels = await getRelatedShorts(novel.id, novel.shortNovelGenre)

  // 增加浏览次数（异步，不阻塞页面渲染）
  incrementViewCount(novel.id)

  const chapter = novel.chapters[0]
  const readingTime = estimateReadingTime(novel.wordCount)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Reader Area */}
          <main className="flex-1 lg:max-w-4xl">
            <ShortNovelReader
              novel={{
                id: novel.id,
                title: novel.title,
                slug: novel.slug,
                blurb: novel.blurb,
                shortNovelGenre: novel.shortNovelGenre,
                wordCount: novel.wordCount,
                viewCount: novel.viewCount,
                likeCount: novel.likeCount,
                averageRating: novel.averageRating,
                authorName: novel.authorName,
                status: novel.status,
                ratingsCount: novel._count.ratings,
                commentsCount: novel._count.comments,
              }}
              chapter={{
                id: chapter.id,
                content: chapter.content,
              }}
              ratings={novel.ratings}
              readingTime={readingTime}
            />
          </main>

          {/* Sidebar - You May Like */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <YouMayLike novels={relatedNovels} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
