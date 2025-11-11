// src/components/shared/LibraryModal.tsx
'use client'

import { useState, useEffect } from 'react'
import MyLibrary from '@/components/library/MyLibrary'
import ProfileView from '@/components/library/ProfileView'
import ReadingHistory from '@/components/library/ReadingHistory'

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
  const [activeTab, setActiveTab] = useState<'library' | 'history' | 'upload' | 'manage'>('library')

  // 当 defaultView 改变时更新 activeTab
  useEffect(() => {
    if (isOpen && defaultView !== 'profile') {
      setActiveTab(defaultView as any)
    }
  }, [isOpen, defaultView])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - 模糊背景 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile Section - 永远在顶部 */}
        <div className="flex-shrink-0">
          <ProfileView user={user} />
        </div>

        {/* Horizontal Navigation Bar - 在 Profile 下面 */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 pt-4">
          <div className="flex items-center gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('library')}
              className={`pb-3 px-2 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'library'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Library
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-2 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reading History
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-2 font-semibold transition-colors whitespace-nowrap opacity-50 cursor-not-allowed ${
                activeTab === 'upload'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600'
              }`}
              disabled
            >
              Upload My Novel
              <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`pb-3 px-2 font-semibold transition-colors whitespace-nowrap opacity-50 cursor-not-allowed ${
                activeTab === 'manage'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600'
              }`}
              disabled
            >
              Manage My Novel
              <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
            </button>
          </div>
        </div>

        {/* Content - 底部内容区 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'library' && <MyLibrary onClose={onClose} />}
          {activeTab === 'history' && <ReadingHistory onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}
