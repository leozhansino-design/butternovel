'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/shared/Footer'
import BookCard from '@/components/front/BookCard'

interface Novel {
  id: number
  title: string
  slug: string
  blurb: string
  coverImage: string
  authorName: string
  status: string
  category: {
    id: number
    name: string
    slug: string
  }
  chaptersCount: number
  likesCount: number
}

interface SearchResponse {
  success: boolean
  data?: {
    novels: Novel[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
    query: string | null
    category: number | null
  }
  error?: string
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category') || ''
  const pageParam = parseInt(searchParams.get('page') || '1')

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [currentPage, setCurrentPage] = useState(pageParam)
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([])

  // 获取分类列表
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.data || [])
        }
      })
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  // 执行搜索
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (queryParam) params.set('q', queryParam)
        if (categoryParam) params.set('category', categoryParam)
        params.set('page', pageParam.toString())
        params.set('limit', '20')

        const response = await fetch(`/api/search?${params.toString()}`)
        const data: SearchResponse = await response.json()

        if (data.success && data.data) {
          setNovels(data.data.novels)
          setPagination(data.data.pagination)
        } else {
          setError(data.error || 'Failed to fetch search results')
          setNovels([])
        }
      } catch (err) {
        setError('An error occurred while searching')
        setNovels([])
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [queryParam, categoryParam, pageParam])

  // 处理搜索表单提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams({ q: searchQuery, page: '1' })
  }

  // 处理分类筛选
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    updateSearchParams({ category: categoryId, page: '1' })
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateSearchParams({ page: page.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 更新URL参数
  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/search?${params.toString()}`)
  }

  // 清除筛选
  const handleClearFilters = () => {
    setSelectedCategory('')
    setSearchQuery('')
    router.push('/search')
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 max-w-7xl py-8 sm:py-12">
          {/* 搜索头部 */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Search Novels
            </h1>

            {/* 搜索框 */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or description..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* 筛选器 */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter by category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {(queryParam || categoryParam) && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* 搜索结果信息 */}
          {queryParam && (
            <div className="mb-6 text-gray-600">
              <p>
                Showing results for <span className="font-semibold text-gray-900">&quot;{queryParam}&quot;</span>
                {categoryParam && categories.find(c => c.id.toString() === categoryParam) && (
                  <span> in <span className="font-semibold text-gray-900">
                    {categories.find(c => c.id.toString() === categoryParam)?.name}
                  </span></span>
                )}
              </p>
              <p className="text-sm mt-1">
                {pagination.total} {pagination.total === 1 ? 'novel' : 'novels'} found
              </p>
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Searching...</p>
              </div>
            </div>
          )}

          {/* 错误状态 */}
          {error && !loading && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {/* 搜索结果 */}
          {!loading && !error && novels.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
                {novels.map((novel) => (
                  <BookCard
                    key={novel.id}
                    id={novel.id}
                    title={novel.title}
                    slug={novel.slug}
                    coverImage={novel.coverImage}
                    category={novel.category.name}
                    status={novel.status}
                    chapters={novel.chaptersCount}
                    likes={novel.likesCount}
                  />
                ))}
              </div>

              {/* 分页 */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-yellow-400 text-gray-900 font-semibold'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* 无结果 */}
          {!loading && !error && novels.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {queryParam ? 'No results found' : 'Start searching'}
              </h2>
              <p className="text-gray-600">
                {queryParam
                  ? 'Try different keywords or filters'
                  : 'Enter a search term to find novels'}
              </p>
            </div>
          )}
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading search...</p>
          </div>
        </div>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  )
}
