'use client'

import { useState, useEffect } from 'react'
import LibraryModal from '@/components/shared/LibraryModal'
import { useSession } from 'next-auth/react'

interface AuthorNameButtonProps {
  authorId: string
  authorName: string
}

export default function AuthorNameButton({ authorId, authorName }: AuthorNameButtonProps) {
  const { data: session } = useSession()
  const [showModal, setShowModal] = useState(false)
  const [isOfficial, setIsOfficial] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch author's official status
  useEffect(() => {
    const fetchAuthorStatus = async () => {
      try {
        const res = await fetch(`/api/user/${authorId}`)
        const data = await res.json()
        if (data.success && data.data) {
          setIsOfficial(data.data.isOfficial || false)
        }
      } catch (error) {
        console.error('Failed to fetch author status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (authorId) {
      fetchAuthorStatus()
    }
  }, [authorId])

  const handleClick = () => {
    setShowModal(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="font-semibold text-gray-900 hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <span>{authorName}</span>
        {/* Show official badge if official account */}
        {!isLoading && isOfficial && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Official
          </span>
        )}
      </button>

      {showModal && (
        <LibraryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image
          }}
          viewUserId={authorId}
        />
      )}
    </>
  )
}
