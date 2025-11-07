// src/app/page.tsx - 完整替换
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategorySection from '@/components/front/CategorySection'
import HomePageSkeleton from '@/components/front/HomePageSkeleton'

async function getFeaturedNovels() {
  return await prisma.novel.findMany({
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
}

async function getNovelsByCategory(categorySlug: string, limit: number = 10) {
  return await prisma.novel.findMany({
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
}

async function HomeContent() {
  const [featuredNovels, fantasyNovels, urbanNovels, romanceNovels] = await Promise.all([
    getFeaturedNovels(),
    getNovelsByCategory('fantasy', 10),
    getNovelsByCategory('urban', 10),
    getNovelsByCategory('romance', 10),
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
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeContent />
      </Suspense>
      <Footer />
    </div>
  )
}

export const revalidate = 3600