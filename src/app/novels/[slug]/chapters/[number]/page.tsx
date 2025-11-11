// src/app/novels/[slug]/chapters/[number]/page.tsx
// ✅ 修复：统一缓存策略
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ChapterReader from '@/components/reader/ChapterReader'
import ViewTracker from '@/components/ViewTracker'

interface PageProps {
  params: Promise<{
    slug: string
    number: string
  }>
}

async function getChapterData(slug: string, chapterNumber: number) {
  const [novel, chapter, chapters, nextChapterContent] = await Promise.all([
    prisma.novel.findUnique({
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
    
    prisma.chapter.findFirst({
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
    
    prisma.chapter.findMany({
      where: {
        novel: { slug },
        isPublished: true
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

    prisma.chapter.findFirst({
      where: {
        novel: { slug },
        chapterNumber: chapterNumber + 1,
        isPublished: true
      },
      select: {
        content: true,
      }
    })
  ])

  if (!novel || !chapter) return null

  return {
    novel,
    chapter,
    chapters,
    nextChapterContent,
    totalChapters: novel._count.chapters
  }
}

// ✅ 修复：只保留这一个缓存配置（1小时）
export const revalidate = 3600

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
  const novels = await prisma.novel.findMany({
    where: {
      isPublished: true,
      isBanned: false,
    },
    select: {
      slug: true,
      chapters: {
        where: { isPublished: true },
        select: { chapterNumber: true },
        take: 50
      }
    },
    take: 100
  })

  const params: { slug: string; number: string }[] = []
  
  for (const novel of novels) {
    for (const chapter of novel.chapters) {
      params.push({
        slug: novel.slug,
        number: chapter.chapterNumber.toString()
      })
    }
  }

  return params
}