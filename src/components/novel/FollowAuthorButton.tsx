'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface FollowAuthorButtonProps {
  authorId: string
  authorName: string
}

export default function FollowAuthorButton({ authorId, authorName }: FollowAuthorButtonProps) {
  const { data: session, status } = useSession()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Don't show if authorId is missing
  if (!authorId) {
    return null
  }

  const isOwnProfile = session?.user?.id === authorId

  // 🔧 FIX: 使用 useCallback 防止无限循环
  const checkFollowStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/follow-status?userId=${authorId}`)
      const data = await res.json()
      if (data.isFollowing !== undefined) {
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error('[FollowAuthorButton] Failed to check follow status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }, [authorId])

  // Check follow status
  useEffect(() => {
    if (session?.user?.id && !isOwnProfile) {
      checkFollowStatus()
    } else {
      setCheckingStatus(false)
    }
  }, [session?.user?.id, isOwnProfile, checkFollowStatus])

  const handleFollowToggle = async () => {
    if (!session?.user?.id) {
      alert('Please log in to follow authors')
      return
    }

    try {
      setLoading(true)
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch('/api/user/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authorId })
      })

      if (res.ok) {
        setIsFollowing(!isFollowing)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update follow status')
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      alert('Failed to update follow status')
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if viewing own profile (wait for session to load first)
  if (status === 'loading') {
    return null // Wait for session to load
  }

  if (isOwnProfile) {
    return null
  }

  if (checkingStatus && session?.user?.id) {
    return null // Or a small loading spinner
  }

  // 🔧 FIX: 已经follow的作者，完全隐藏按钮
  if (isFollowing) {
    return null
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className="ml-3 px-4 py-1.5 rounded-full font-semibold text-sm transition-all shadow-md bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Loading...' : 'Follow'}
    </button>
  )
}
