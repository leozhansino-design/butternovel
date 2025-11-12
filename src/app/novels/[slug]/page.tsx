// src/app/novels/[slug]/page.tsx
// ⚡ 性能优化：减少数据库查询 + 延迟加载章节内容
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/shared/Footer'
import ViewTracker from '@/components/ViewTracker'
import { formatNumber } from '@/lib/format'
import AddToLibraryButton from '@/components/novel/AddToLibraryButton'
import FirstChapterContent from '@/components/novel/FirstChapterContent'
import { getCloudinaryBlurUrl } from '@/lib/image-utils'
import RatingDisplay from '@/components/novel/RatingDisplay'

async function getNovel(slug: string) {
  // ⚡ 性能优化：移除content，避免阻塞首屏渲染
  const novel = await prisma.novel.findUnique({
    where: { slug },
    include: {
      category: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { chapterNumber: 'asc' },
        take: 2, // 只取前2章元数据
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          wordCount: true,
          // ⚡ content 移除，由 FirstChapterContent 组件单独加载
        },
      },
      _count: {
        select: {
          chapters: true,
          likes: true,
        },
      },
    },
  })

  if (!novel || !novel.isPublished || novel.isBanned) {
    return null
  }

  return novel
}

export const revalidate = 3600

export default async function NovelDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // ⚡ 并行化数据获取 - 减少总等待时间
  const [session, novel] = await Promise.all([
    auth(),
    getNovel(slug)
  ])

  if (!novel) {
    notFound()
  }

  const firstChapter = novel.chapters[0]
  const secondChapter = novel.chapters[1]

  return (
    <>
      <ViewTracker novelId={novel.id} />
      
      {/* 预加载第二章 */}
      {secondChapter && (
        <link
          rel="prefetch"
          href={`/novels/${novel.slug}/chapters/${secondChapter.chapterNumber}`}
          as="document"
        />
      )}
      
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50 via-orange-50 to-[#fff7ed]">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="grid lg:grid-cols-[380px_1fr] gap-8 p-8 md:p-12">
                    
                    <div className="flex flex-col items-center lg:items-start">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                        <div className="relative w-[280px] h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                          <Image
                            src={novel.coverImage}
                            alt={novel.title}
                            fill
                            className="object-cover"
                            priority
                            placeholder="blur"
                            blurDataURL={getCloudinaryBlurUrl(novel.coverImage)}
                          />
                        </div>
                      </div>

                      {/* Rating Display */}
                      <div className="w-[280px] mt-4">
                        <RatingDisplay
                          novelId={novel.id}
                          averageRating={novel.averageRating ?? 0}
                          totalRatings={novel.totalRatings}
                          userId={session?.user?.id}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      
                      <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                          {novel.title}
                        </h1>
                        <div className="flex items-center gap-2 text-lg">
                          <span className="text-gray-600">by</span>
                          <span className="font-semibold text-gray-900">
                            {novel.authorName}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full font-medium text-sm">
                          {novel.category.name}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full font-medium text-sm ${
                          novel.status === 'COMPLETED' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {novel.status === 'COMPLETED' ? '✓ Completed' : '📝 Ongoing'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="font-medium">{formatNumber(novel.viewCount)}</span>
                          <span className="text-sm">Reads</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span className="font-medium">{novel._count.likes}</span>
                          <span className="text-sm">Votes</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="font-medium">{novel._count.chapters}</span>
                          <span className="text-sm">Chapters</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{Math.ceil(novel.wordCount / 200)}m</span>
                          <span className="text-sm">Read</span>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0">
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Blurb
                        </h2>
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[240px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50">
                            {novel.blurb}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Link
                          href={`/novels/${novel.slug}/chapters/1`}
                          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-[#f4d03f] via-[#e8b923] to-[#d4a017] hover:from-[#f5d85a] hover:via-[#f4d03f] hover:to-[#e8b923] text-white font-semibold rounded-xl transition-all shadow-[0_4px_14px_rgba(228,185,35,0.4)] hover:shadow-[0_6px_20px_rgba(228,185,35,0.5)] hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Start Reading
                        </Link>

                        {/* ⭐ 替换这里的button为AddToLibraryButton组件 */}
                        <AddToLibraryButton 
                          novelId={novel.id}
                          userId={session?.user?.id}
                        />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="h-12 bg-gradient-to-b from-[#fff7ed] via-[#fffaf5] via-[#fffcfa] to-white"></div>

          {/* ⚡ 延迟加载第一章内容 - 不阻塞首屏渲染 */}
          {firstChapter && (
            <Suspense
              fallback={
                <section className="pt-6 pb-12 md:pb-16 bg-white">
                  <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-8">
                      <div className="text-center border-b border-gray-200 pb-8">
                        <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="h-5 bg-gray-100 rounded animate-pulse"
                            style={{
                              width: i % 4 === 3 ? '85%' : '100%',
                              animationDelay: `${i * 50}ms`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              }
            >
              <FirstChapterContent
                chapterId={firstChapter.id}
                chapterNumber={firstChapter.chapterNumber}
                chapterTitle={firstChapter.title}
                novelSlug={novel.slug}
                hasSecondChapter={!!secondChapter}
                secondChapterNumber={secondChapter?.chapterNumber}
                novelStatus={novel.status}
              />
            </Suspense>
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}