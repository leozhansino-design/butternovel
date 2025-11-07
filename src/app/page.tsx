// src/app/page.tsx
import { prisma } from '@/lib/prisma'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'

/**
 * 获取精选小说
 * 前台显示规则:
 * 1. 必须已发布 (isPublished = true)
 * 2. 未被封禁 (isBanned = false)
 */
async function getFeaturedNovels() {
  return await prisma.novel.findMany({
    where: {
      isPublished: true,
      isBanned: false,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    },
    orderBy: [
      { likeCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 24,
  })
}

/**
 * 按分类获取小说
 */
async function getNovelsByCategory(categorySlug: string, limit: number = 10) {
  return await prisma.novel.findMany({
    where: {
      isPublished: true,
      isBanned: false,
      category: {
        slug: categorySlug
      }
    },
    include: {
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
}

export default async function HomePage() {
  // ⭐ 关键优化: 不调用 auth() 避免数据库连接池超时
  // 并行获取所有数据
  const [featuredNovels, fantasyNovels, urbanNovels, romanceNovels] = await Promise.all([
    getFeaturedNovels(),
    getNovelsByCategory('fantasy', 10),
    getNovelsByCategory('urban', 10),
    getNovelsByCategory('romance', 10),
  ])

  // 转换数据格式以适配现有组件
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* ⭐ Header 不传 user,避免 auth() 调用 */}
      <Header />

      <main className="flex-1">
        {/* Featured Section */}
        {featuredBooks.length > 0 ? (
          <section className="bg-gradient-to-b from-amber-50/50 to-white py-12 md:py-16">
            <div className="container mx-auto px-4 max-w-7xl">
              <FeaturedCarousel books={featuredBooks} />
            </div>
          </section>
        ) : (
          <section className="bg-gradient-to-b from-amber-50/50 to-white py-16 md:py-24">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Welcome to ButterNovel
                </h2>
                <p className="text-gray-600">
                  Amazing stories are coming soon. Stay tuned!
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Category Sections */}
        <div className="bg-white">
          <div className="container mx-auto px-4 max-w-7xl py-16 space-y-20">
            
            {fantasyBooks.length > 0 && (
              <CategorySection 
                title="Fantasy Novels" 
                books={fantasyBooks}
                categorySlug="fantasy"
              />
            )}
            
            {urbanBooks.length > 0 && (
              <CategorySection 
                title="Urban Stories" 
                books={urbanBooks}
                categorySlug="urban"
              />
            )}
            
            {romanceBooks.length > 0 && (
              <CategorySection 
                title="Romance Collection" 
                books={romanceBooks}
                categorySlug="romance"
              />
            )}
            
            {fantasyBooks.length === 0 && urbanBooks.length === 0 && romanceBooks.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-gray-400">More stories coming soon...</p>
              </div>
            )}
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}