// src/app/novels/[slug]/chapters/[number]/page.tsx
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

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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
  return []
}