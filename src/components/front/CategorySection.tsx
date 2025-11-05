// src/components/front/CategorySection.tsx
import BookCard from './BookCard'
import Link from 'next/link'

interface CategorySectionProps {
  title: string
  icon: string
  categorySlug?: string
  books: Array<{
    id: number
    title: string
    category: string
    chapters: number
    likes: number
    slug?: string
    coverImage?: string
  }>
}

export default function CategorySection({ 
  title, 
  icon, 
  books, 
  categorySlug 
}: CategorySectionProps) {
  return (
    <section className="mb-16">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            {title}
          </h2>
          <span className="text-sm text-gray-500 mt-1">
            ({books.length})
          </span>
        </div>
        
        {categorySlug && books.length > 0 && (
          <Link 
            href={`/novels?category=${categorySlug}`}
            className="text-[var(--text-secondary)] hover:text-[#b39320] transition-colors font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Books Grid */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No novels in this category yet.</p>
        </div>
      )}
    </section>
  )
}