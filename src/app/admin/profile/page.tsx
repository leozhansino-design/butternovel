'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile')
        const data = await res.json()
        setProfile(data)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Profile</h1>
      
      {profile && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">{profile.displayName || 'Admin'}</h2>
            <p className="text-gray-600 mb-2"><strong>Email:</strong> {profile.email}</p>
            <p className="text-gray-600 mb-2"><strong>Bio:</strong> {profile.bio || 'No bio'}</p>
            {profile.avatar && (
              <img src={profile.avatar} alt="Avatar" className="w-20 h-20 rounded-full mt-4" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}