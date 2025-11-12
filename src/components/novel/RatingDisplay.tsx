'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import StarRating from './StarRating'
import RatingModal from './RatingModal'

interface RatingDisplayProps {
  novelId: number
  averageRating: number | null
  totalRatings: number
}

export default function RatingDisplay({
  novelId,
  averageRating,
  totalRatings
}: RatingDisplayProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleStarClick = () => {
    if (!session) {
      // 未登录，跳转到登录页
      router.push('/auth/login?callbackUrl=' + window.location.pathname)
      return
    }
    setIsModalOpen(true)
  }

  const handleRatingsCountClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 mt-4">
        <StarRating
          rating={averageRating || 0}
          totalRatings={totalRatings}
          interactive={false}
          size="medium"
          showCount={true}
          onCountClick={handleRatingsCountClick}
        />

        {/* 可点击的评分按钮 */}
        {totalRatings === 0 ? (
          <button
            onClick={handleStarClick}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Be the first to rate
          </button>
        ) : (
          <button
            onClick={handleStarClick}
            className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium transition-colors"
          >
            Rate this novel
          </button>
        )}
      </div>

      <RatingModal
        novelId={novelId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
