// src/app/page.tsx
import { prisma } from '@/lib/prisma'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'

/**
 * 获取精选小说
 * 前台显示规则：
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Carousel */}
        {featuredBooks.length > 0 ? (
          <section className="container mx-auto px-4 py-8 md:py-12">
            <FeaturedCarousel books={featuredBooks} />
          </section>
        ) : (
          <section className="container mx-auto px-4 py-16 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-12 border border-blue-100">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to ButterNovel!
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                The library is being prepared with amazing stories. Check back soon for your next great read!
              </p>
            </div>
          </section>
        )}

        {/* Categories Sections */}
        <div className="container mx-auto px-4 py-8 space-y-12">
          {fantasyBooks.length > 0 && (
            <CategorySection 
              title="Fantasy" 
              icon="🗡️" 
              books={fantasyBooks}
              categorySlug="fantasy"
            />
          )}
          
          {urbanBooks.length > 0 && (
            <CategorySection 
              title="Urban" 
              icon="🏙️" 
              books={urbanBooks}
              categorySlug="urban"
            />
          )}
          
          {romanceBooks.length > 0 && (
            <CategorySection 
              title="Romance" 
              icon="💕" 
              books={romanceBooks}
              categorySlug="romance"
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}