'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Novel {
  id: number
  title: string
  slug: string
  coverImage: string | null
  isPublished: boolean
  viewCount: number
  likeCount: number
  _count: {
    chapters: number
    ratings: number
  }
}

interface PublicNovelsViewProps {
  userId: string
}

export default function PublicNovelsView({ userId }: PublicNovelsViewProps) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/user/${userId}/novels?page=${page}&limit=10`)
        const data = await res.json()

        if (res.ok) {
          setNovels(data.novels || [])
          setTotalPages(data.pagination?.totalPages || 1)
          setTotal(data.pagination?.total || 0)
        }
      } catch (error) {
        console.error('Failed to fetch novels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNovels()
  }, [userId, page])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (novels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <svg
          className="w-20 h-20 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <p className="text-gray-600 text-lg font-medium mb-2">No published novels</p>
        <p className="text-gray-500 text-sm">
          This user hasn't published any novels yet
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Novels Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {novels.map((novel) => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            className="group"
          >
            <div className="relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              {/* Cover Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                {novel.coverImage ? (
                  <img
                    src={novel.coverImage}
                    alt={novel.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-4xl text-gray-400">📖</span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                    Published
                  </span>
                </div>
              </div>

              {/* Novel Info */}
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {novel.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>{novel.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span>{novel.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>{novel._count.chapters}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white/60 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} novels
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
