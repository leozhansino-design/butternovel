// src/app/page.tsx
// ✅ 只做性能优化，UI和功能100%保持不变
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { withRetry, withConcurrency } from '@/lib/db-utils'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'
import HomePageSkeleton from '@/components/front/HomePageSkeleton'

async function getFeaturedNovels() {
  // ✅ 添加自动重试机制处理间歇性连接问题
  return await withRetry(() =>
    prisma.novel.findMany({
      where: {
        isPublished: true,
        isBanned: false,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        blurb: true,
        category: {
          select: {
            name: true,
          }
        }
      },
      orderBy: [
        { likeCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 24,
    })
  )
}

async function getNovelsByCategory(categorySlug: string, limit: number = 10) {
  // ✅ 添加自动重试机制处理间歇性连接问题
  return await withRetry(() =>
    prisma.novel.findMany({
      where: {
        isPublished: true,
        isBanned: false,
        category: {
          slug: categorySlug
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        category: {
          select: {
            name: true,
          }
        },
        _count: {
          select: {
            chapters: true,
            likes: true,
          }
        }
      },
      orderBy: [
        { likeCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })
  )
}

async function HomeContent() {
  // ✅ 修复：使用并发控制避免同时发起太多查询导致连接池耗尽
  // Prisma Postgres 连接池限制为 5，4 个并发查询可能导致超时
  const [featuredNovels, [fantasyNovels, urbanNovels, romanceNovels]] = await Promise.all([
    getFeaturedNovels(),
    // 分类查询串行执行，避免连接池耗尽
    withConcurrency([
      () => getNovelsByCategory('fantasy', 10),
      () => getNovelsByCategory('urban', 10),
      () => getNovelsByCategory('romance', 10),
    ], { concurrency: 2 }) // 最多同时 2 个分类查询
  ])

  const featuredBooks = featuredNovels.map(novel => ({
    id: novel.id,
    title: novel.title,
    slug: novel.slug,
    coverImage: novel.coverImage,
    description: novel.blurb.length > 100 
      ? novel.blurb.substring(0, 100) + '...'
      : novel.blurb,
    category: {
      name: novel.category.name
    }
  }))

  const fantasyBooks = fantasyNovels.map(novel => ({
    id: novel.id,
    title: novel.title,
    category: novel.category.name,
    chapters: novel._count.chapters,
    likes: novel._count.likes,
    slug: novel.slug,
    coverImage: novel.coverImage,
  }))

  const urbanBooks = urbanNovels.map(novel => ({
    id: novel.id,
    title: novel.title,
    category: novel.category.name,
    chapters: novel._count.chapters,
    likes: novel._count.likes,
    slug: novel.slug,
    coverImage: novel.coverImage,
  }))

  const romanceBooks = romanceNovels.map(novel => ({
    id: novel.id,
    title: novel.title,
    category: novel.category.name,
    chapters: novel._count.chapters,
    likes: novel._count.likes,
    slug: novel.slug,
    coverImage: novel.coverImage,
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
          {fantasyBooks.length > 0 && (
            <CategorySection 
              title="✨ Fantasy Adventures" 
              books={fantasyBooks}
              categorySlug="fantasy"
            />
          )}

          {urbanBooks.length > 0 && (
            <CategorySection 
              title="🏙️ Urban Stories" 
              books={urbanBooks}
              categorySlug="urban"
            />
          )}

          {romanceBooks.length > 0 && (
            <CategorySection 
              title="💕 Romance" 
              books={romanceBooks}
              categorySlug="romance"
            />
          )}

          {featuredBooks.length === 0 && fantasyBooks.length === 0 && urbanBooks.length === 0 && romanceBooks.length === 0 && (
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