'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface FollowAuthorButtonProps {
  authorId: string
  authorName: string
}

export default function FollowAuthorButton({ authorId, authorName }: FollowAuthorButtonProps) {
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const isOwnProfile = session?.user?.id === authorId

  // Check follow status
  useEffect(() => {
    if (session?.user?.id && !isOwnProfile) {
      const checkFollowStatus = async () => {
        try {
          const res = await fetch(`/api/user/follow-status?userId=${authorId}`)
          const data = await res.json()
          if (data.isFollowing !== undefined) {
            setIsFollowing(data.isFollowing)
          }
        } catch (error) {
          console.error('Failed to check follow status:', error)
        } finally {
          setCheckingStatus(false)
        }
      }
      checkFollowStatus()
    } else {
      setCheckingStatus(false)
    }
  }, [session, authorId, isOwnProfile])

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

  // Don't show button if viewing own profile or not logged in
  if (!session?.user?.id || isOwnProfile) {
    return null
  }

  if (checkingStatus) {
    return null // Or a small loading spinner
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`ml-3 px-4 py-1.5 rounded-full font-semibold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
      }`}
    >
      {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
