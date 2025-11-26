// src/components/front/CategoryFeaturedGrid.tsx
// Featured + Grid layout: 1 large book on left + smaller books on right
'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Book {
  id: number;
  title: string;
  slug?: string;
  coverImage?: string;
  rating?: number | null;
  blurb?: string;
}

interface CategoryFeaturedGridProps {
  title: string;
  categorySlug?: string;
  books: Book[];
}

export default function CategoryFeaturedGrid({
  title,
  categorySlug,
  books
}: CategoryFeaturedGridProps) {
  if (books.length === 0) return null;

  const featured = books[0];
  const gridBooks = books.slice(1, 7); // Show up to 6 books in grid

  return (
    <section className="w-full px-4 md:px-8 lg:px-[150px]">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          {title}
        </h2>
        {categorySlug && (
          <Link
            href={`/search?genre=${categorySlug}`}
            className="group flex items-center gap-1.5 text-sm sm:text-base text-gray-600 hover:text-amber-600 transition-colors font-medium"
          >
            <span>View All</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Layout: Featured + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Featured Book - Large Card */}
        <Link
          href={featured.slug ? `/novels/${featured.slug}` : `/novels/book-${featured.id}`}
          className="lg:col-span-5 group"
        >
          <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row lg:flex-col">
              {/* Cover */}
              <div className="relative w-full sm:w-48 lg:w-full aspect-[2/3] sm:aspect-auto sm:h-64 lg:aspect-[3/4] flex-shrink-0">
                <Image
                  src={featured.coverImage || `https://images.unsplash.com/photo-${1544947950 + featured.id}?w=400&h=600&fit=crop`}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 192px, 400px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Rating Badge */}
                {featured.rating && featured.rating > 0 && (
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-gray-900">{featured.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-5 sm:flex-1 lg:flex-none">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2 mb-2">
                  {featured.title}
                </h3>
                {featured.blurb && (
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {featured.blurb}
                  </p>
                )}
                <div className="mt-4 inline-flex items-center gap-2 text-amber-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  Read Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Grid Books */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-3 gap-3 sm:gap-4">
            {gridBooks.map((book) => (
              <Link
                key={book.id}
                href={book.slug ? `/novels/${book.slug}` : `/novels/book-${book.id}`}
                className="group block"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all">
                  <Image
                    src={book.coverImage || `https://images.unsplash.com/photo-${1544947950 + book.id}?w=200&h=300&fit=crop`}
                    alt={book.title}
                    fill
                    sizes="(max-width: 640px) 30vw, 150px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {book.rating && book.rating > 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow">
                      <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {book.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                  {book.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
