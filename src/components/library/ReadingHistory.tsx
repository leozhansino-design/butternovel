// src/components/library/ReadingHistory.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Novel = {
  id: number
  title: string
  slug: string
  coverImage: string
  authorName: string
  status: string
  totalChapters: number
  categoryName: string
  lastReadAt: string
}

type ReadingHistoryProps = {
  onClose?: () => void
}

export default function ReadingHistory({ onClose }: ReadingHistoryProps) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        console.log('[ReadingHistory] Fetching history...')
        const res = await fetch('/api/reading-history')

        console.log('[ReadingHistory] Response status:', res.status)

        // Handle unauthorized (not logged in)
        if (res.status === 401) {
          console.log('[ReadingHistory] User not logged in')
          setNovels([])
          setLoading(false)
          return
        }

        const data = await res.json()
        console.log('[ReadingHistory] Response data:', data)

        if (res.ok && data.novels) {
          const novelsArray = Array.isArray(data.novels) ? data.novels : []
          console.log('[ReadingHistory] Setting', novelsArray.length, 'novels')
          setNovels(novelsArray)
        } else {
          const errorMsg = data.error || data.message || `Failed to load (${res.status})`
          console.error('[ReadingHistory] Error:', errorMsg)
          setError(errorMsg)
          setNovels([])
        }
      } catch (error) {
        console.error('[ReadingHistory] Exception:', error)
        setError(error instanceof Error ? error.message : 'Network error')
        setNovels([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

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
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-gray-600 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  if (!novels || novels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-7xl mb-6">📚</div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">No Reading History Yet</h3>
          <p className="text-gray-600 text-lg mb-6">Start exploring novels to see your history here!</p>
          <Link
            href="/"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Browse Novels
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {novels && novels.map((novel) => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            onClick={onClose}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Cover Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img
                src={novel.coverImage}
                alt={novel.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  novel.status === 'COMPLETED'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {novel.status === 'COMPLETED' ? 'Completed' : 'Ongoing'}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
                {novel.title}
              </h3>

              <p className="text-sm text-gray-600 mb-2">by {novel.authorName}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                  {novel.categoryName}
                </span>
                <span>•</span>
                <span>{novel.totalChapters} chapters</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
