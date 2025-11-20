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
        <section className="bg-gradient-to-b from-sky-50/50 to-white py-6 sm:py-8 md:py-12 lg:py-16">
          <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <FeaturedCarousel books={featuredBooks} />
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-sky-50/50 to-white py-6 sm:py-8 md:py-12 lg:py-16">
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

// ✅ ISR: 1小时重新验证
// Next.js 会在第一次请求时渲染页面，然后缓存HTML 1小时
// 这样可以避免每次请求都访问 Redis，将 Redis 使用量从 2500+/天 减少到 ~50/天（98% reduction）
//
// 工作原理：
// - 第一次请求：渲染 → Redis GET（可能miss）→ DB查询 → Redis SET → Next.js缓存HTML
// - 后续请求（1小时内）：直接返回缓存的HTML（0 Redis调用，0 DB查询）
// - 1小时后或revalidatePath触发：重新渲染一次，重复上述循环
//
// ⚠️ 移除了 force-dynamic：
// - 之前错误地认为需要 force-dynamic 让 Redis 工作
// - 实际上 ISR 在运行时渲染（非构建时），Redis 可以正常工作
// - force-dynamic 导致每次请求都渲染 = 每次都调用 Redis = 2500+ commands/天
export const revalidate = 3600

// 🔧 CRITICAL FIX: Override Upstash's default no-store fetch behavior
// Upstash Redis SDK uses fetch with cache: 'no-store' by default
// This conflicts with Next.js ISR and causes "dynamic server usage" errors
// By setting fetchCache = 'force-cache', we allow ISR to work properly
export const fetchCache = 'force-cache'

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
