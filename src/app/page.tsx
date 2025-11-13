// src/app/page.tsx
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { withRetry, withConcurrency } from '@/lib/db-utils'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/cache'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'
import HomePageSkeleton from '@/components/front/HomePageSkeleton'

async function getFeaturedNovels() {
  // ⚡ 优化：使用 Redis 缓存 + 数据库层面随机排序
  return await getOrSet(
    CacheKeys.HOME_FEATURED,
    async () => {
      return await withRetry(() =>
        prisma.$queryRaw<Array<{
          id: number
          title: string
          slug: string
          coverImage: string
          blurb: string
          categoryName: string
        }>>`
          SELECT
            n.id,
            n.title,
            n.slug,
            n."coverImage",
            n.blurb,
            c.name as "categoryName"
          FROM "Novel" n
          INNER JOIN "Category" c ON n."categoryId" = c.id
          WHERE n."isPublished" = true AND n."isBanned" = false
          ORDER BY RANDOM()
          LIMIT 24
        `
      )
    },
    CacheTTL.HOME_FEATURED
  )
}

async function getAllCategories() {
  // ⚡ 优化：使用 Redis 缓存分类列表
  return await getOrSet(
    CacheKeys.HOME_ALL_CATEGORIES,
    async () => {
      return await withRetry(() =>
        prisma.category.findMany({
          orderBy: { order: 'asc' }
        })
      )
    },
    CacheTTL.HOME_CATEGORY
  )
}

async function getNovelsByCategory(categorySlug: string, limit: number = 10) {
  // ⚡ 优化：使用 Redis 缓存分类小说
  return await getOrSet(
    CacheKeys.HOME_CATEGORY(categorySlug),
    async () => {
      return await withRetry(() =>
        prisma.$queryRaw<Array<{
          id: number
          title: string
          slug: string
          coverImage: string
          categoryName: string
          status: string
          chaptersCount: number
          likesCount: number
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
          ORDER BY RANDOM()
          LIMIT ${limit}
        `
      )
    },
    CacheTTL.HOME_CATEGORY
  )
}

async function HomeContent() {
  // 获取所有类别
  const categories = await getAllCategories()

  // 获取 featured 小说
  const featuredNovels = await getFeaturedNovels()

  // 为每个类别获取小说（使用并发控制）
  const categoryNovelsArray = await withConcurrency(
    categories.map(category => () => getNovelsByCategory(category.slug, 10)),
    { concurrency: 3 } // 最多同时 3 个查询
  )

  // 构造类别数据映射
  const categoryData = categories.map((category, index) => ({
    name: category.name,
    slug: category.slug,
    novels: categoryNovelsArray[index]
  })).filter(cat => cat.novels.length > 0) // 只保留有小说的类别

  const featuredBooks = featuredNovels.map(novel => ({
    id: novel.id,
    title: novel.title,
    slug: novel.slug,
    coverImage: novel.coverImage,
    description: novel.blurb.length > 100
      ? novel.blurb.substring(0, 100) + '...'
      : novel.blurb,
    category: {
      name: novel.categoryName
    }
  }))

  return (
    <main className="flex-1">
      {featuredBooks.length > 0 ? (
        <section className="bg-gradient-to-b from-amber-50/50 to-white py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <FeaturedCarousel books={featuredBooks} />
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-amber-50/50 to-white py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <p className="text-gray-500">No featured novels yet</p>
          </div>
        </section>
      )}

      <div className="bg-white">
        <div className="container mx-auto px-4 max-w-7xl py-16 space-y-20">
          {categoryData.map(cat => {
            const books = cat.novels.map(novel => ({
              id: novel.id,
              title: novel.title,
              category: novel.categoryName,
              status: novel.status,
              chapters: Number(novel.chaptersCount),
              likes: Number(novel.likesCount),
              slug: novel.slug,
              coverImage: novel.coverImage,
            }))

            return (
              <CategorySection
                key={cat.slug}
                title={cat.name}
                books={books}
                categorySlug={cat.slug}
              />
            )
          })}

          {featuredBooks.length === 0 && categoryData.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No novels yet</h2>
              <p className="text-gray-600">Check back soon for new stories!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

// ✅ 添加1小时缓存
export const revalidate = 3600

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ✅ 性能优化：使用Suspense流式渲染，立刻显示骨架屏 */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeContent />
      </Suspense>
      <Footer />
    </div>
  )
}
