// src/components/library/ReadingHistory.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type NovelInHistory = {
  id: number
  title: string
  slug: string
  coverImage: string | null
  category: string
  status: string
  viewedAt: string
}

type ReadingHistoryProps = {
  onClose: () => void
}

export default function ReadingHistory({ onClose }: ReadingHistoryProps) {
  const [novels, setNovels] = useState<NovelInHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/novel-views')
      const data = await res.json()

      if (res.ok) {
        setNovels(data.history)
      } else {
        setError(data.error || 'Failed to load reading history')
      }
    } catch (err) {
      console.error('Failed to fetch reading history:', err)
      setError('Failed to load reading history')
    } finally {
      setLoading(false)
    }
  }

  const handleNovelClick = (novel: NovelInHistory) => {
    router.push(`/novels/${novel.slug}`)
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (novels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reading History Yet</h3>
          <p className="text-gray-600">Visit some novel pages to start building your reading history!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reading History</h2>
          <p className="text-gray-600 mt-1">Novels you've visited recently</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {novels.map((novel) => (
            <button
              key={novel.id}
              onClick={() => handleNovelClick(novel)}
              className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-amber-500 hover:shadow-lg transition-all"
            >
              {/* Cover Image */}
              <div className="aspect-[2/3] relative bg-gray-100">
                {novel.coverImage ? (
                  <Image
                    src={novel.coverImage}
                    alt={novel.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                    <svg className="w-16 h-16 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    novel.status === 'ongoing'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {novel.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                  </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-amber-600 transition-colors">
                  {novel.title}
                </h3>
                <p className="text-xs text-gray-500 mb-1">{novel.category}</p>
                <p className="text-xs text-gray-400">Viewed {formatDate(novel.viewedAt)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
