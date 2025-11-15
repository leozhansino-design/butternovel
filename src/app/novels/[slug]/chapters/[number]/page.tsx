// src/app/novels/[slug]/chapters/[number]/page.tsx
// ✅ 修复：统一缓存策略
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import ChapterReader from '@/components/reader/ChapterReader'
import ViewTracker from '@/components/ViewTracker'

interface PageProps {
  params: Promise<{
    slug: string
    number: string
  }>
}

async function getChapterData(slug: string, chapterNumber: number) {
  // 🔄 添加数据库重试机制，解决连接超时问题
  try {
    const [novel, chapter, chapters, nextChapterContent] = await Promise.all([
      withRetry(
        () => prisma.novel.findUnique({
          where: { slug },
          select: {
            id: true,
            title: true,
            slug: true,
            _count: {
              select: { chapters: true }
            }
          }
        }),
        { operationName: 'Get novel for chapter page' }
      ),

      withRetry(
        () => prisma.chapter.findFirst({
          where: {
            novel: { slug },
            chapterNumber: chapterNumber,
            isPublished: true
          },
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            content: true,
            wordCount: true,
            novelId: true,
          }
        }),
        { operationName: 'Get current chapter' }
      ),

      // ✅ 优化: 只加载当前章节附近的章节 (窗口分页,防止大型小说崩溃)
      withRetry(
        () => prisma.chapter.findMany({
          where: {
            novel: { slug },
            isPublished: true,
            chapterNumber: {
              gte: Math.max(1, chapterNumber - 10),
              lte: chapterNumber + 10
            }
          },
          select: {
            id: true,
            chapterNumber: true,
            title: true
          },
          orderBy: {
            chapterNumber: 'asc'
          }
        }),
        { operationName: 'Get nearby chapters list' }
      ),

      withRetry(
        () => prisma.chapter.findFirst({
          where: {
            novel: { slug },
            chapterNumber: chapterNumber + 1,
            isPublished: true
          },
          select: {
            content: true,
          }
        }),
        { operationName: 'Get next chapter for prefetch' }
      )
    ])

    if (!novel || !chapter) return null

    return {
      novel,
      chapter,
      chapters,
      nextChapterContent,
      totalChapters: novel._count.chapters
    }
  } catch (error: unknown) {
    // 🔧 FIX: Better error logging for Server Component errors
    console.error('[Chapter Page] Error fetching chapter data:', {
      slug,
      chapterNumber,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Check for specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string }
      if (dbError.code === 'P1001') {
        console.error('[Chapter Page] Database connection failed - max connections may be reached')
      } else if (dbError.code === 'P1008') {
        console.error('[Chapter Page] Database operation timed out')
      }
    }

    // Re-throw to let Next.js handle it
    throw error
  }
}

// ✅ 修复：页面必须是 dynamic 的，因为 layout 中的 HeaderWrapper 调用了 auth()
// auth() 会使用 cookies/headers，导致页面变成动态的
export const dynamic = 'force-dynamic'

// 🔧 修复 build 连接池超时：允许动态参数，不强制预渲染所有章节
export const dynamicParams = true

export default async function ChapterPage({ params }: PageProps) {
  const resolvedParams = await params
  const chapterNumber = parseInt(resolvedParams.number)

  if (isNaN(chapterNumber)) {
    notFound()
  }

  const data = await getChapterData(resolvedParams.slug, chapterNumber)

  if (!data) {
    notFound()
  }

  return (
    <>
      <ViewTracker novelId={data.novel.id} />
      
      {data.nextChapterContent && (
        <link
          rel="prefetch"
          href={`/novels/${data.novel.slug}/chapters/${chapterNumber + 1}`}
          as="document"
        />
      )}
      
      <ChapterReader
        novel={data.novel}
        chapter={data.chapter}
        chapters={data.chapters}
        totalChapters={data.totalChapters}
      />
    </>
  )
}

export async function generateStaticParams() {
  // 🔧 修复构建时数据库连接问题：完全跳过预渲染
  // 所有章节页面都通过 dynamicParams = true 在访问时动态生成
  // 这样可以避免构建时的数据库连接超时问题

  // 返回空数组，不预渲染任何章节页面
  return []
}