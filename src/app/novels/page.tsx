// src/app/novels/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/cache'
import Footer from '@/components/shared/Footer'
import BookCard from '@/components/front/BookCard'

interface NovelsPageProps {
  searchParams: Promise<{
    category?: string
  }>
}

async function getAllNovels(categorySlug?: string) {
  const cacheKey = categorySlug
    ? CacheKeys.CATEGORY_NOVELS(categorySlug)
    : 'novels:all'

  return await getOrSet(
    cacheKey,
    async () => {
      if (categorySlug) {
        // Verify category exists
        const category = await withRetry(() =>
          prisma.category.findUnique({
            where: { slug: categorySlug },
            select: { id: true, name: true, slug: true }
          })
        ) as any

        if (!category) {
          return { category: null, novels: [] }
        }

        // Get novels in this category
        const novels = await withRetry(() =>
          prisma.$queryRaw<Array<{
            id: number
            title: string
            slug: string
            coverImage: string
            status: string
            chaptersCount: number
            likesCount: number
            categoryName: string
          }>>`
            SELECT
              n.id,
              n.title,
              n.slug,
              n."coverImage",
              n.status,
              c.name as "categoryName",
              (SELECT COUNT(*) FROM "Chapter" ch WHERE ch."novelId" = n.id AND ch."isPublished" = true) as "chaptersCount",
              (SELECT COUNT(*) FROM "NovelLike" nl WHERE nl."novelId" = n.id) as "likesCount"
            FROM "Novel" n
            INNER JOIN "Category" c ON n."categoryId" = c.id
            WHERE n."isPublished" = true
              AND n."isBanned" = false
              AND c.slug = ${categorySlug}
            ORDER BY n."createdAt" DESC
            LIMIT 200
          `
        ) as any[]

        return { category, novels }
      } else {
        // Get all novels
        const novels = await withRetry(() =>
          prisma.$queryRaw<Array<{
            id: number
            title: string
            slug: string
            coverImage: string
            status: string
            chaptersCount: number
            likesCount: number
            categoryName: string
          }>>`
            SELECT
              n.id,
              n.title,
              n.slug,
              n."coverImage",
              n.status,
              c.name as "categoryName",
              (SELECT COUNT(*) FROM "Chapter" ch WHERE ch."novelId" = n.id AND ch."isPublished" = true) as "chaptersCount",
              (SELECT COUNT(*) FROM "NovelLike" nl WHERE nl."novelId" = n.id) as "likesCount"
            FROM "Novel" n
            INNER JOIN "Category" c ON n."categoryId" = c.id
            WHERE n."isPublished" = true
              AND n."isBanned" = false
            ORDER BY n."createdAt" DESC
            LIMIT 200
          `
        ) as any[]

        return { category: null, novels }
      }
    },
    CacheTTL.CATEGORY_NOVELS
  )
}

async function NovelsContent({ categorySlug }: { categorySlug?: string }) {
  const data = await getAllNovels(categorySlug)

  if (categorySlug && !data.category) {
    notFound()
  }

  const { category, novels } = data

  return (
    <main className="flex-1 bg-white">
      <div className="container mx-auto px-4 max-w-7xl py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {category ? category.name : 'All Novels'}
          </h1>
          <p className="text-sm text-gray-500">
            {novels.length} {novels.length === 1 ? 'novel' : 'novels'}
          </p>
        </div>

        {/* Novels Grid */}
        {novels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {novels.map(novel => (
              <BookCard
                key={novel.id}
                id={novel.id}
                title={novel.title}
                slug={novel.slug}
                coverImage={novel.coverImage}
                category={novel.categoryName}
                status={novel.status}
                chapters={Number(novel.chaptersCount)}
                likes={Number(novel.likesCount)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {category ? `No novels in ${category.name} yet` : 'No novels yet'}
            </h2>
            <p className="text-gray-600">
              Check back soon for new stories!
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

// ✅ ISR: 30分钟重新验证
export const revalidate = 1800

// ⚡ CRITICAL: 强制缓存所有 fetch（包括 Upstash Redis），允许 ISR
// Upstash Redis 默认使用 no-store → 导致页面无法静态生成
// 使用 force-cache 强制覆盖，让页面可以进行 ISR
export const dynamic = 'force-dynamic'

export default async function NovelsPage({ searchParams }: NovelsPageProps) {
  const params = await searchParams
  const categorySlug = params.category

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading novels...</p>
          </div>
        </div>
      }>
        <NovelsContent categorySlug={categorySlug} />
      </Suspense>
      <Footer />
    </div>
  )
}
