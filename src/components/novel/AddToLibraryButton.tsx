'use client'

import { useState, useEffect } from 'react'
import LoginModal from '@/components/shared/LoginModal'
import Toast from '@/components/shared/Toast'

interface AddToLibraryButtonProps {
  novelId: number
  userId?: string
}

export default function AddToLibraryButton({ novelId, userId }: AddToLibraryButtonProps) {
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (userId) {
      checkLibraryStatus()
    }
  }, [novelId, userId])

  const checkLibraryStatus = async () => {
    try {
      const res = await fetch(`/api/library/check?novelId=${novelId}`)
      const data = await res.json()
      setIsInLibrary(data.isInLibrary)
    } catch (error) {
      console.error('Failed to check library status:', error)
    }
  }

  const handleClick = async () => {
    if (!userId) {
      setShowLoginModal(true)
      return
    }

    setLoading(true)

    try {
      const method = isInLibrary ? 'DELETE' : 'POST'
      const res = await fetch('/api/library', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId })
      })

      if (res.ok) {
        const newStatus = !isInLibrary
        setIsInLibrary(newStatus)
        
        setToast({
          show: true,
          message: newStatus ? 'Added to Library' : 'Removed from Library',
          type: 'success'
        })
      } else {
        setToast({
          show: true,
          message: 'Failed to update library',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Failed to update library:', error)
      setToast({
        show: true,
        message: 'Something went wrong',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* ⭐ 毛玻璃效果风格 */}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          group relative p-4 rounded-xl transition-all duration-300 overflow-hidden
          ${isInLibrary 
            ? 'bg-amber-500/10 backdrop-blur-sm border border-amber-500/50' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-amber-500/50'
          }
          shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isInLibrary ? 'Remove from Library' : 'Add to Library'}
        aria-label="Add to Library"
      >
        <svg 
          className={`
            w-6 h-6 transition-all duration-300 relative z-10
            ${isInLibrary 
              ? 'text-amber-600' 
              : 'text-gray-500 group-hover:text-amber-600'
            }
            group-hover:scale-110
            ${loading ? 'animate-pulse' : ''}
          `}
          fill={isInLibrary ? 'currentColor' : 'none'}
          stroke="currentColor" 
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
        
        {/* 发光效果层 */}
        <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-all duration-300" />
      </button>
    </>
  )
}