// src/components/shared/LibraryModal.tsx
'use client'

import { useState, useEffect } from 'react'
import MyLibrary from '@/components/library/MyLibrary'
import ProfileView from '@/components/library/ProfileView'
import ReadingHistory from '@/components/library/ReadingHistory'
import WorksTab from '@/components/library/WorksTab'
import RatingsTab from '@/components/profile/RatingsTab'

interface LibraryModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  defaultView?: 'profile' | 'library' | 'history' | 'works' | 'reviews'
}

export default function LibraryModal({ isOpen, onClose, user, defaultView = 'library' }: LibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'works' | 'library' | 'history' | 'reviews'>(
    defaultView === 'history' ? 'history' :
    defaultView === 'works' ? 'works' :
    defaultView === 'reviews' ? 'reviews' :
    'library'
  )

  // 当 defaultView 改变时更新视图
  useEffect(() => {
    if (isOpen) {
      if (defaultView === 'history') {
        setActiveTab('history')
      } else if (defaultView === 'works') {
        setActiveTab('works')
      } else if (defaultView === 'reviews') {
        setActiveTab('reviews')
      } else {
        setActiveTab('library')
      }
    }
  }, [isOpen, defaultView])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - 模糊背景 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal - 全新布局 */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-2xl w-[95vw] max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2.5 hover:bg-white/80 rounded-full transition-all bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 顶部 - Profile 卡片 (毛玻璃效果) */}
        <div className="flex-shrink-0 p-6 pb-0">
          <ProfileView user={user} />
        </div>

        {/* 中间 - Tab 导航栏 */}
        <div className="flex-shrink-0 px-6 pt-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('works')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                  activeTab === 'works'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                Works
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                  activeTab === 'library'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                My Library
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                Reading History
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                Reviews
              </button>
            </div>
          </div>
        </div>

        {/* 底部 - Tab 内容 */}
        <div className="flex-1 overflow-hidden px-6 pt-4 pb-6">
          <div className="h-full bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            {activeTab === 'works' && <WorksTab onClose={onClose} />}
            {activeTab === 'library' && <MyLibrary onClose={onClose} />}
            {activeTab === 'history' && <ReadingHistory onClose={onClose} />}
            {activeTab === 'reviews' && <RatingsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
