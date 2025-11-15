// src/app/category/[slug]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/cache'
import Footer from '@/components/shared/Footer'
import BookCard from '@/components/front/BookCard'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCategoryWithNovels(slug: string) {
  return await getOrSet(
    CacheKeys.CATEGORY_PAGE(slug),
    async () => {
      // Get category
      const category = await withRetry(() =>
        prisma.category.findUnique({
          where: { slug },
          select: {
            id: true,
            name: true,
            slug: true,
          }
        })
      ) as any

      if (!category) {
        return null
      }

      // Get novels in this category
      const novels = await withRetry(() =>
        prisma.$queryRaw<Array<{
          id: number
          title: string
          slug: string
          coverImage: string
          blurb: string
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
            n.blurb,
            n.status,
            c.name as "categoryName",
            (SELECT COUNT(*) FROM "Chapter" ch WHERE ch."novelId" = n.id AND ch."isPublished" = true) as "chaptersCount",
            (SELECT COUNT(*) FROM "NovelLike" nl WHERE nl."novelId" = n.id) as "likesCount"
          FROM "Novel" n
          INNER JOIN "Category" c ON n."categoryId" = c.id
          WHERE n."isPublished" = true
            AND n."isBanned" = false
            AND c.slug = ${slug}
          ORDER BY n."createdAt" DESC
          LIMIT 100
        `
      ) as any[]

      return {
        category,
        novels
      }
    },
    CacheTTL.CATEGORY_PAGE
  )
}

async function CategoryContent({ slug }: { slug: string }) {
  const data = await getCategoryWithNovels(slug)

  if (!data || !data.category) {
    notFound()
  }

  const { category, novels } = data

  return (
    <main className="flex-1 bg-white">
      <div className="container mx-auto px-4 max-w-7xl py-12">
        {/* Category Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {category.name}
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
              No novels yet in this category
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

// ⚡ CRITICAL: 覆盖 Upstash Redis 的 no-store，允许 ISR 缓存
export const fetchCache = 'default-cache'

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading category...</p>
          </div>
        </div>
      }>
        <CategoryContent slug={slug} />
      </Suspense>
      <Footer />
    </div>
  )
}

// 🔧 FIX: 允许动态路由参数，避免 404
export const dynamicParams = true

// 🔧 FIX: 完全禁用静态生成，避免构建时数据库连接问题
// 在 serverless 环境中，构建时访问数据库会导致连接池耗尽
// 所有页面将在请求时动态生成
export async function generateStaticParams() {
  // 返回空数组，不预渲染任何页面
  // 通过 dynamicParams = true 允许所有路由在运行时动态生成
  return []
}
