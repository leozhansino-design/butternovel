// src/components/shared/LibraryModal.tsx
'use client'

import { useState, useEffect } from 'react'
import MyLibrary from '@/components/library/MyLibrary'
import ProfileView from '@/components/library/ProfileView'

interface LibraryModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  defaultView?: 'profile' | 'library' | 'history'
}

export default function LibraryModal({ isOpen, onClose, user, defaultView = 'library' }: LibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'history'>(defaultView === 'history' ? 'history' : 'library')

  // 当 defaultView 改变时更新视图
  useEffect(() => {
    if (isOpen) {
      if (defaultView === 'history') {
        setActiveTab('history')
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

        {/* 中间 - Library 筛选栏 (往下移) */}
        <div className="flex-shrink-0 px-6 pt-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('library')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  activeTab === 'library'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                My Library
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                Reading History
              </button>
            </div>
          </div>
        </div>

        {/* 底部 - 书籍网格 */}
        <div className="flex-1 overflow-hidden px-6 pt-4 pb-6">
          <div className="h-full bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            {activeTab === 'library' && <MyLibrary onClose={onClose} />}
            {activeTab === 'history' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-7xl mb-6">📖</div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Reading History</h3>
                  <p className="text-gray-600 text-lg">Coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
