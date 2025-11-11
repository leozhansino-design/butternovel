// src/components/shared/LibraryModal.tsx
'use client'

import { useState } from 'react'
import LibrarySidebar from '@/components/library/LibrarySidebar'
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
  defaultView?: 'profile' | 'library'
}

export default function LibraryModal({ isOpen, onClose, user, defaultView = 'library' }: LibraryModalProps) {
  const [activeView, setActiveView] = useState<'profile' | 'library'>(defaultView)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - 模糊背景 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - 大尺寸 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[95vw] max-w-7xl h-[90vh] flex overflow-hidden">
        {/* 左侧边栏 */}
        <LibrarySidebar activeView={activeView} onViewChange={setActiveView} />

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeView === 'profile' ? (
              <ProfileView user={user} />
            ) : (
              <MyLibrary onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}