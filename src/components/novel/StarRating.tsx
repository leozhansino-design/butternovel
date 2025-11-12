'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number // 2, 4, 6, 8, 10 or average rating (e.g., 8.6)
  totalRatings?: number
  userRating?: number | null
  onRate?: (score: number) => void
  interactive?: boolean
  size?: 'small' | 'medium' | 'large'
  showCount?: boolean
  onCountClick?: () => void
}

export default function StarRating({
  rating,
  totalRatings,
  userRating,
  onRate,
  interactive = false,
  size = 'medium',
  showCount = false,
  onCountClick
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-2xl'
  }

  // 将评分转换为星星数（0-5）
  const ratingToStars = (score: number) => score / 2

  const displayRating = hoverRating !== null ? hoverRating : rating
  const stars = ratingToStars(displayRating)
  const fullStars = Math.floor(stars)
  const hasHalfStar = stars % 1 >= 0.5

  const handleStarClick = (starIndex: number) => {
    if (!interactive || !onRate) return
    const score = (starIndex + 1) * 2 // 转换为 2, 4, 6, 8, 10
    onRate(score)
  }

  const handleStarHover = (starIndex: number) => {
    if (!interactive) return
    const score = (starIndex + 1) * 2
    setHoverRating(score)
  }

  const handleMouseLeave = () => {
    if (!interactive) return
    setHoverRating(null)
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const isFilled = index < fullStars
          const isHalf = index === fullStars && hasHalfStar

          return (
            <button
              key={index}
              onClick={() => handleStarClick(index)}
              onMouseEnter={() => handleStarHover(index)}
              disabled={!interactive}
              className={`${sizeClasses[size]} relative ${
                interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
              }`}
            >
              {/* 空心星 */}
              <svg
                className="absolute inset-0 text-gray-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>

              {/* 实心星 */}
              {(isFilled || isHalf) && (
                <svg
                  className="absolute inset-0 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : {}}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* 显示平均分 */}
      {rating > 0 && !interactive && (
        <span className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
          {(rating / 2).toFixed(1)}
        </span>
      )}

      {/* 显示评分数量 */}
      {showCount && totalRatings !== undefined && (
        <button
          onClick={onCountClick}
          className={`text-gray-500 dark:text-gray-400 hover:underline ${textSizeClasses[size]}`}
        >
          {totalRatings === 0 ? (
            'No ratings yet'
          ) : (
            `${totalRatings.toLocaleString()} rating${totalRatings !== 1 ? 's' : ''}`
          )}
        </button>
      )}
    </div>
  )
}
