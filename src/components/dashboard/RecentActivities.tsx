'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, MessageSquare, Heart, Star, Clock } from 'lucide-react'

interface Activity {
  type: 'chapter_published' | 'comment' | 'like' | 'rating'
  timestamp: string
  data: any
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/dashboard/activities')
        if (res.ok) {
          const data = await res.json()
          setActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'chapter_published':
        return <BookOpen className="text-blue-500" size={18} />
      case 'comment':
        return <MessageSquare className="text-green-500" size={18} />
      case 'like':
        return <Heart className="text-red-500" size={18} />
      case 'rating':
        return <Star className="text-yellow-500" size={18} />
      default:
        return <Clock className="text-gray-400" size={18} />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const renderActivity = (activity: Activity) => {
    const { type, data } = activity

    switch (type) {
      case 'chapter_published':
        return (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              Published <span className="font-medium">Chapter {data.chapterNumber}: {data.chapterTitle}</span>
            </p>
            <Link
              href={`/novels/${data.novelSlug}`}
              className="text-xs text-indigo-600 hover:text-indigo-700 truncate block"
            >
              {data.novelTitle}
            </Link>
          </div>
        )

      case 'comment':
        return (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{data.userName}</span> commented
            </p>
            <p className="text-xs text-gray-600 truncate">{data.content}</p>
            <Link
              href={`/novels/${data.novelSlug}`}
              className="text-xs text-indigo-600 hover:text-indigo-700 truncate block"
            >
              {data.novelTitle} - Chapter {data.chapterNumber}
            </Link>
          </div>
        )

      case 'like':
        return (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{data.userName}</span> liked your novel
            </p>
            <Link
              href={`/novels/${data.novelSlug}`}
              className="text-xs text-indigo-600 hover:text-indigo-700 truncate block"
            >
              {data.novelTitle}
            </Link>
          </div>
        )

      case 'rating':
        return (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{data.userName}</span> rated your novel{' '}
              <span className="text-yellow-600 font-medium">{data.score} stars</span>
            </p>
            <Link
              href={`/novels/${data.novelSlug}`}
              className="text-xs text-indigo-600 hover:text-indigo-700 truncate block"
            >
              {data.novelTitle}
            </Link>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="p-6 text-center">
          <div className="text-gray-400">Loading activities...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
      </div>

      {activities.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <div
              key={`${activity.type}-${activity.timestamp}-${index}`}
              className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              {renderActivity(activity)}

              {/* Timestamp */}
              <div className="flex-shrink-0 text-xs text-gray-400">
                {formatTimestamp(activity.timestamp)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <Clock className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500 mb-2">No recent activities</p>
          <p className="text-sm text-gray-400">
            Your recent chapter publications, comments, and ratings will appear here
          </p>
        </div>
      )}
    </div>
  )
}
