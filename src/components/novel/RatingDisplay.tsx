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
}

export default function RatingDisplay({
  novelId,
  averageRating,
  totalRatings,
  userId,
  hasUserRated = false,
  userRatingScore,
}: RatingDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // ✅ 始终显示小说的平均分星星
  const renderStars = (score: number) => {
    const starCount = score / 2 // Convert 2-10 to 1-5 stars
    const fullStars = Math.floor(starCount)
    const hasHalfStar = starCount % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    // ✅ 未评分用户hover时高亮星星
    const color = (!hasUserRated && isHovered) ? '#FFA500' : '#FFB800'
    const emptyColor = (!hasUserRated && isHovered) ? '#FFD700' : '#E5E7EB'

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <svg
            key={`full-${i}`}
            className={`w-6 h-6 transition-all ${!hasUserRated && isHovered ? 'scale-110' : ''}`}
            fill={color}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg
            className={`w-6 h-6 transition-all ${!hasUserRated && isHovered ? 'scale-110' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
          >
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
          <svg
            key={`empty-${i}`}
            className={`w-6 h-6 transition-all ${!hasUserRated && isHovered ? 'scale-110' : ''}`}
            fill={emptyColor}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="mt-4">
        <div className="text-center">
          {/* ✅ 星星区域：始终显示平均分，未评分用户hover有效果 */}
          <div
            className={`flex items-center justify-center gap-1 mb-2 ${
              !hasUserRated ? 'cursor-pointer' : 'cursor-default'
            }`}
            onMouseEnter={() => !hasUserRated && setIsHovered(true)}
            onMouseLeave={() => !hasUserRated && setIsHovered(false)}
            onClick={() => setIsModalOpen(true)}
          >
            {renderStars(averageRating)}
          </div>

          {/* 评分数字和统计 */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {totalRatings > 0 ? averageRating.toFixed(1) : '-'}
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-gray-500 hover:text-amber-700 hover:underline transition-colors"
            >
              {totalRatings > 0
                ? `${formatNumber(totalRatings)} ${totalRatings === 1 ? 'rating' : 'ratings'}`
                : 'No ratings yet'
              }
            </button>
          </div>
        </div>
      </div>

      <RatingModal
        novelId={novelId}
        averageRating={averageRating}
        totalRatings={totalRatings}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
      />
    </>
  )
}
