'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Plus, Edit, Trash2, Eye, Star, FileText, PenTool } from 'lucide-react'

type Novel = {
  id: number
  title: string
  slug: string
  coverImage: string
  status: string
  isPublished: boolean
  categoryName: string
  totalChapters: number
  viewCount: number
  likeCount: number
  averageRating: number | null
  updatedAt: string
}

export default function NovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchNovels()
  }, [])

  const fetchNovels = async () => {
    try {
      const response = await fetch('/api/dashboard/novels')
      if (response.ok) {
        const data = await response.json()
        setNovels(data.novels)
      }
    } catch (error) {
      console.error('Failed to fetch novels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/dashboard/novels/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNovels(novels.filter((novel) => novel.id !== id))
        alert('Novel deleted successfully')
      } else {
        const data = await response.json()
        alert(`Failed to delete novel: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete novel:', error)
      alert('An error occurred while deleting the novel')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Novels</h1>
          <p className="text-gray-600">Manage your novels and chapters</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Upload Novel
        </Link>
      </div>

      {/* Novels Grid */}
      {novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {novels.map((novel) => (
            <div
              key={novel.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Cover Image */}
              <div className="relative h-64 bg-gray-200">
                <Image
                  src={novel.coverImage}
                  alt={novel.title}
                  fill
                  className="object-cover"
                />
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      novel.isPublished
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {novel.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Title */}
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                  {novel.title}
                </h3>

                {/* Category */}
                <p className="text-sm text-gray-600 mb-3">{novel.categoryName}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <FileText size={14} />
                    <span>{novel.totalChapters}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Eye size={14} />
                    <span>{novel.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Star size={14} className={novel.averageRating ? 'fill-yellow-400 text-yellow-400' : ''} />
                    <span>{novel.averageRating?.toFixed(1) || '—'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/novels/${novel.id}/chapters`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <BookOpen size={16} />
                    Manage Chapters
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/novels/${novel.id}/edit`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(novel.id, novel.title)}
                      disabled={deleting === novel.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {deleting === novel.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Last Updated */}
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Updated {new Date(novel.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No novels yet</h3>
          <p className="text-gray-600 mb-6">
            Start your writing journey by uploading your first novel
          </p>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Upload Your First Novel
          </Link>
        </div>
      )}
    </div>
  )
}
