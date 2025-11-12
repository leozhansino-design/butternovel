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
  hasUserRated,
  userRatingScore,
}: RatingSectionProps) {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: 'login' | 'register' }>({
    isOpen: false,
    tab: 'login',
  })

  const handleAuthRequired = () => {
    setAuthModal({ isOpen: true, tab: 'login' })
  }

  return (
    <>
      <div className="w-[280px] mt-4">
        <RatingDisplay
          novelId={novelId}
          averageRating={averageRating}
          totalRatings={totalRatings}
          userId={userId}
          hasUserRated={hasUserRated}
          userRatingScore={userRatingScore}
          onAuthRequired={handleAuthRequired}
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
