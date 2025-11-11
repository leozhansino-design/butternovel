// src/components/library/ProfileView.tsx
'use client'

import { useState, useEffect } from 'react'

type ProfileViewProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  stats: {
    booksInLibrary: number
    chaptersRead: number
    readingTime: number
  }
}

export default function ProfileView({ user }: ProfileViewProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/profile')
      const data = await res.json()

      if (res.ok) {
        setProfileData(data.user)
        setEditName(data.user.name || '')
        setEditBio(data.user.bio || '')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (editName.trim().length === 0) {
      setError('Name cannot be empty')
      return
    }

    if (editBio.length > 500) {
      setError('Bio must be 500 characters or less')
      return
    }

    try {
      setSaving(true)
      setError('')

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData(prev => prev ? {
          ...prev,
          name: data.user.name,
          bio: data.user.bio
        } : null)
        setIsEditing(false)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(profileData?.name || '')
    setEditBio(profileData?.bio || '')
    setError('')
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    )
  }

  const { stats } = profileData

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with gradient background */}
      <div className="relative h-48 bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-br from-amber-500/30 to-pink-500/30"></div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-20 pb-8">
        {/* Profile Card with glassmorphism */}
        <div className="relative backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Avatar and basic info */}
          <div className="flex items-start gap-6 mb-8">
            {user.image ? (
              <img
                src={user.image}
                alt={profileData.name || 'User'}
                className="w-28 h-28 rounded-3xl object-cover ring-4 ring-white shadow-xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-4xl ring-4 ring-white shadow-xl">
                {profileData.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio <span className="text-gray-400">({editBio.length}/500)</span>
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {profileData.name || 'Anonymous Reader'}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit profile"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-3">{profileData.email}</p>
                  {profileData.bio ? (
                    <p className="text-gray-700 leading-relaxed">{profileData.bio}</p>
                  ) : (
                    <p className="text-gray-400 italic">No bio yet. Click the edit button to add one!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reading Statistics */}
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Reading Journey
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Books in Library */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-sm font-medium">Library</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats.booksInLibrary}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.booksInLibrary === 1 ? 'book' : 'books'} collected
                    </div>
                  </div>
                </div>

                {/* Chapters Read */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium">Progress</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats.chaptersRead}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.chaptersRead === 1 ? 'chapter' : 'chapters'} completed
                    </div>
                  </div>
                </div>

                {/* Reading Time */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Time Spent</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats.readingTime}h
                    </div>
                    <div className="text-sm text-gray-600">
                      hours reading
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
