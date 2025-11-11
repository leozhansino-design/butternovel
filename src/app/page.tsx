// src/app/page.tsx
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { withRetry, withConcurrency } from '@/lib/db-utils'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'
import HomePageSkeleton from '@/components/front/HomePageSkeleton'

async function getFeaturedNovels() {
  // 随机抽取 featured 小说
  const allNovels = await withRetry(() =>
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
    })
  )

  // 随机打乱并取前24个
  const shuffled = allNovels.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 24)
}

async function getAllCategories() {
  return await withRetry(() =>
    prisma.category.findMany({
      orderBy: { order: 'asc' }
    })
  )
}

async function getNovelsByCategory(categorySlug: string, limit: number = 10) {
  // 随机抽取该类别的小说
  const allNovels = await withRetry(() =>
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
    })
  )

  // 随机打乱并取指定数量
  const shuffled = allNovels.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
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
      name: novel.category.name
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
              category: novel.category.name,
              chapters: novel._count.chapters,
              likes: novel._count.likes,
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
