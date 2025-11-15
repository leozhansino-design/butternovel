// src/app/page.tsx
// ⚡ 优化：使用单个缓存键，减少 Redis commands 从 17 降到 1（节省94%）
import { Suspense } from 'react'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'
import HomePageSkeleton from '@/components/front/HomePageSkeleton'
import { getHomePageData } from '@/lib/cache-optimized'

async function HomeContent() {
  // ✅ 优化：使用单个缓存键获取所有首页数据
  // 优化前：17 Redis reads (1 featured + 1 categories + 15 category novels)
  // 优化后：1 Redis read (home:all-data)
  // 节省：94% Redis commands
  const homeData = await getHomePageData()

  const { featured, categories, categoryNovels } = homeData

  // 构造类别数据映射
  const categoryData = categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    novels: categoryNovels[category.slug] || []
  })).filter(cat => cat.novels.length > 0) // 只保留有小说的类别

  const featuredBooks = featured.map(novel => ({
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
        <section className="bg-gradient-to-b from-amber-50/50 to-white py-6 sm:py-8 md:py-12 lg:py-16">
          <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <FeaturedCarousel books={featuredBooks} />
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-amber-50/50 to-white py-6 sm:py-8 md:py-12 lg:py-16">
          <div className="container mx-auto px-3 sm:px-4 max-w-7xl text-center">
            <p className="text-sm sm:text-base text-gray-500">No featured novels yet</p>
          </div>
        </section>
      )}

      <div className="bg-white">
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl py-8 sm:py-12 md:py-16 space-y-12 sm:space-y-16 md:space-y-20">
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

// ✅ 使用 force-dynamic 确保 Redis 缓存层工作
// 策略：每次请求都检查 Redis，只有 miss 时查数据库
//
// 缓存架构：
// 1. Redis 缓存（home:all-data，TTL=1小时）
// 2. 并发控制：防止缓存击穿
//
// 首次部署可能有多个并发请求（预热、health check、边缘节点）
// 这是正常的，getOrSet 会处理并发，只有第一个请求查数据库
export const dynamic = 'force-dynamic'
export const revalidate = 0 // 禁用 ISR，完全依赖 Redis

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
