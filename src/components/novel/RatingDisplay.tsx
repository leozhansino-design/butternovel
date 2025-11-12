'use client'
// src/components/novel/RatingDisplay.tsx
// 评分显示组件（封面下方）

import { useState } from 'react'
import RatingModal from './RatingModal'
import { formatNumber } from '@/lib/format'

interface RatingDisplayProps {
  novelId: number
  averageRating: number
  totalRatings: number
  userId?: string
  hasUserRated?: boolean
  userRatingScore?: number
  onAuthRequired?: () => void
}

export default function RatingDisplay({
  novelId,
  averageRating,
  totalRatings,
  userId,
  hasUserRated = false,
  userRatingScore,
  onAuthRequired,
}: RatingDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const handleOpenModal = () => {
    if (!userId && onAuthRequired) {
      onAuthRequired()
      return
    }
    setIsModalOpen(true)
  }

  const renderStars = (score: number, interactive: boolean = false) => {
    const starCount = score / 2 // Convert 2-10 to 1-5 stars
    const fullStars = Math.floor(starCount)
    const hasHalfStar = starCount % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    const color = '#FFB800'
    const emptyColor = '#E5E7EB'

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="w-6 h-6" fill={color} viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="half-star">
                <stop offset="50%" stopColor={color} />
                <stop offset="50%" stopColor={emptyColor} />
              </linearGradient>
            </defs>
            <path
              fill="url(#half-star)"
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="w-6 h-6" fill={emptyColor} viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    )
  }

  const renderInteractiveStars = () => {
    const displayRating = hoverRating || (hasUserRated && userRatingScore ? userRatingScore : 0)

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const score = star * 2
          const isFilled = displayRating >= score

          return (
            <button
              key={star}
              type="button"
              disabled={hasUserRated}
              className={`transition-all ${
                hasUserRated ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              }`}
              onMouseEnter={() => !hasUserRated && setHoverRating(score)}
              onMouseLeave={() => !hasUserRated && setHoverRating(null)}
              onClick={() => !hasUserRated && handleOpenModal()}
            >
              <svg
                className="w-6 h-6"
                fill={isFilled ? '#FFB800' : '#E5E7EB'}
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="mt-4">
        {totalRatings === 0 ? (
          <div className="text-center">
            <div
              className={`flex items-center justify-center gap-1 mb-2 ${
                !hasUserRated ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => !hasUserRated && handleOpenModal()}
            >
              {renderInteractiveStars()}
            </div>
            <p className="text-sm text-gray-500">No ratings yet</p>
          </div>
        ) : (
          <div className="text-center">
            <div
              className={`flex items-center justify-center gap-2 mb-2 ${
                !hasUserRated ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => !hasUserRated && handleOpenModal()}
            >
              {hasUserRated && userRatingScore ? (
                renderStars(userRatingScore)
              ) : (
                renderInteractiveStars()
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              {hasUserRated && userRatingScore ? (
                <>
                  <span className="text-lg font-bold text-gray-900">
                    Your rating: {userRatingScore.toFixed(1)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <button
                    onClick={handleOpenModal}
                    className="text-sm text-gray-500 hover:text-amber-700 hover:underline transition-colors"
                  >
                    {formatNumber(totalRatings)} {totalRatings === 1 ? 'rating' : 'ratings'}
                  </button>
                </>
              )}
            </div>
            {hasUserRated && (
              <button
                onClick={handleOpenModal}
                className="text-xs text-gray-500 hover:text-amber-700 hover:underline transition-colors text-center mt-1"
              >
                View all {formatNumber(totalRatings)} {totalRatings === 1 ? 'rating' : 'ratings'}
              </button>
            )}
          </div>
        )}
      </div>

      <RatingModal
        novelId={novelId}
        averageRating={averageRating}
        totalRatings={totalRatings}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        onAuthRequired={onAuthRequired}
      />
    </>
  )
}
