'use client'

import { useState, useEffect } from 'react'
import UserBadge from '@/components/badge/UserBadge'
import { getUserLevel } from '@/lib/badge-system'

type User = {
  id: string
  name: string | null
  avatar: string | null
  bio: string | null
  level: number
  contributionPoints: number
}

interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'following' | 'followers'
  onUserClick?: (userId: string) => void
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
  onUserClick
}: FollowListModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen, userId, type])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const endpoint = type === 'following'
        ? `/api/user/${userId}/following`
        : `/api/user/${userId}/followers`

      const res = await fetch(endpoint)
      const data = await res.json()

      if (res.ok) {
        setUsers(data[type] || [])
      }
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (clickedUserId: string) => {
    onUserClick?.(clickedUserId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {type === 'following' ? 'Following' : 'Followers'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No {type === 'following' ? 'following' : 'followers'} yet
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => {
                const levelData = getUserLevel(user.contributionPoints)
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <UserBadge
                      avatar={user.avatar}
                      name={user.name}
                      level={user.level}
                      contributionPoints={user.contributionPoints}
                      size="medium"
                      showLevelName={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {user.name || 'Anonymous Reader'}
                      </div>
                      <div className="text-xs text-amber-600">
                        {levelData.nameEn}
                      </div>
                      {user.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
