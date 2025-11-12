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
      {/* Section Header - 简洁设计,无图标 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          <span className="text-sm text-gray-400 font-medium">
            {books.length} {books.length === 1 ? 'novel' : 'novels'}
          </span>
        </div>
        
        {categorySlug && books.length > 0 && (
          <Link 
            href={`/novels?category=${categorySlug}`}
            className="group flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors font-medium"
          >
            <span>View All</span>
            <svg 
              className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Books Grid - 优化间距 */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-400">No novels in this category yet.</p>
        </div>
      )}
    </section>
  )
}