// src/components/front/CategorySection.tsx - 优化版
import BookCard from './BookCard'
import Link from 'next/link'

interface CategorySectionProps {
  title: string
  categorySlug?: string
  books: Array<{
    id: number
    title: string
    category: string
    status: string
    chapters: number
    likes: number
    slug?: string
    coverImage?: string
  }>
}

export default function CategorySection({ 
  title, 
  books, 
  categorySlug 
}: CategorySectionProps) {
  return (
    <section className="w-full">
      {/* Section Header - 📱 优化移动端spacing */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            {title}
          </h2>
          <span className="text-xs sm:text-sm text-gray-400 font-medium flex-shrink-0">
            {books.length} {books.length === 1 ? 'novel' : 'novels'}
          </span>
        </div>

        {categorySlug && books.length > 0 && (
          <Link
            href={`/novels?category=${categorySlug}`}
            className="group flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-600 hover:text-amber-600 transition-colors font-medium flex-shrink-0 ml-2"
          >
            <span className="hidden sm:inline">View All</span>
            <span className="sm:hidden">All</span>
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Books Grid - 📱 优化移动端间距 */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm sm:text-base text-gray-400">No novels in this category yet.</p>
        </div>
      )}
    </section>
  )
}