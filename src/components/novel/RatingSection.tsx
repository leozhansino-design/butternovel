'use client'
// src/components/novel/RatingSection.tsx
// 评分区域的客户端包装组件

import { useState } from 'react'
import RatingDisplay from './RatingDisplay'
import AuthModal from '@/components/auth/AuthModal'

interface RatingSectionProps {
  novelId: number
  averageRating: number
  totalRatings: number
  userId?: string
  hasUserRated?: boolean
  userRatingScore?: number
}

export default function RatingSection({
  novelId,
  averageRating,
  totalRatings,
  userId,
  hasUserRated = false,
  userRatingScore,
}: RatingSectionProps) {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: 'login' | 'register' }>({
    isOpen: false,
    tab: 'login',
  })

  // 本地状态跟踪用户评分
  const [localHasRated, setLocalHasRated] = useState(hasUserRated)
  const [localUserScore, setLocalUserScore] = useState(userRatingScore)
  const [localAvgRating, setLocalAvgRating] = useState(averageRating)
  const [localTotalRatings, setLocalTotalRatings] = useState(totalRatings)

  const handleAuthRequired = () => {
    setAuthModal({ isOpen: true, tab: 'login' })
  }

  const handleRatingSubmitted = (score: number, newAverage: number, newTotal: number) => {
    setLocalHasRated(true)
    setLocalUserScore(score)
    setLocalAvgRating(newAverage)
    setLocalTotalRatings(newTotal)
  }

  return (
    <>
      <div className="w-[280px] mt-4">
        <RatingDisplay
          novelId={novelId}
          averageRating={localAvgRating}
          totalRatings={localTotalRatings}
          userId={userId}
          hasUserRated={localHasRated}
          userRatingScore={localUserScore}
          onAuthRequired={handleAuthRequired}
          onRatingSubmitted={handleRatingSubmitted}
        />
      </div>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        defaultTab={authModal.tab}
      />
    </>
  )
}
