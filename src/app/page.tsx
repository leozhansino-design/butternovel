// src/app/page.tsx - 优化版
import { prisma } from '@/lib/prisma'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'
import { auth } from '@/lib/auth'

/**
 * 获取精选小说
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
  const session = await auth()
  
  // 并行获取所有数据
  const [featuredNovels, fantasyNovels, urbanNovels, romanceNovels] = await Promise.all([
    getFeaturedNovels(),
    getNovelsByCategory('fantasy', 10),
    getNovelsByCategory('urban', 10),
    getNovelsByCategory('romance', 10),
  ])

  // 转换数据格式
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
      <Header user={session?.user} />

      <main className="flex-1">
        {/* Featured Section - 渐变背景 */}
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

        {/* Category Sections - 白色背景,统一间距 */}
        <div className="bg-white">
          <div className="container mx-auto px-4 max-w-7xl py-16 space-y-20">
            
            {/* Fantasy */}
            {fantasyBooks.length > 0 && (
              <CategorySection 
                title="Fantasy Novels" 
                books={fantasyBooks}
                categorySlug="fantasy"
              />
            )}
            
            {/* Urban */}
            {urbanBooks.length > 0 && (
              <CategorySection 
                title="Urban Stories" 
                books={urbanBooks}
                categorySlug="urban"
              />
            )}
            
            {/* Romance */}
            {romanceBooks.length > 0 && (
              <CategorySection 
                title="Romance Collection" 
                books={romanceBooks}
                categorySlug="romance"
              />
            )}
            
            {/* 如果没有任何小说 */}
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