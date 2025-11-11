// src/components/shared/LibraryModal.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Novel {
  id: number
  title: string
  slug: string
  coverImage: string
  category: string
  totalChapters: number
  addedAt: string
}

interface LibraryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LibraryModal({ isOpen, onClose }: LibraryModalProps) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchLibrary()
    }
  }, [isOpen])

  const fetchLibrary = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/library')
      const data = await res.json()
      setNovels(data.novels || [])
    } catch (error) {
      console.error('Failed to fetch library:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - 模糊背景 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Library</h2>
            <p className="text-sm text-gray-600 mt-1">
              {novels.length} {novels.length === 1 ? 'novel' : 'novels'} in your collection
            </p>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          ) : novels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your library is empty
              </h3>
              <p className="text-gray-600 mb-6">
                Start adding novels to your collection!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Browse Novels
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {novels.map((novel) => (
                <Link
                  key={novel.id}
                  href={`/novels/${novel.slug}`}
                  onClick={onClose}
                  className="group"
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                    <Image
                      src={novel.coverImage}
                      alt={novel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="mt-2 font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {novel.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {novel.category} • {novel.totalChapters} chapters
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}