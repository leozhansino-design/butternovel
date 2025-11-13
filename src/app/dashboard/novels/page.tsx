'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash2, Eye, FileText, MoreHorizontal, BookOpen } from 'lucide-react'

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
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all')

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

  const filteredNovels = novels.filter((novel) => {
    if (filter === 'published') return novel.isPublished
    if (filter === 'drafts') return !novel.isPublished
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Stories</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredNovels.length} {filteredNovels.length === 1 ? 'story' : 'stories'}
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            New Story
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'published'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setFilter('drafts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'drafts'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Drafts
          </button>
        </div>

        {/* Table */}
        {filteredNovels.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNovels.map((novel) => (
                  <tr key={novel.id} className="hover:bg-gray-50 transition-colors">
                    {/* Story */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                          <Image
                            src={novel.coverImage}
                            alt={novel.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/novels/${novel.id}/chapters`}
                            className="font-medium text-gray-900 hover:text-indigo-600"
                          >
                            {novel.title}
                          </Link>
                          <p className="text-sm text-gray-500">{novel.categoryName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          novel.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {novel.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    {/* Chapters */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-700">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{novel.totalChapters}</span>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Eye size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{novel.viewCount.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(novel.updatedAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/novels/${novel.id}/chapters`}
                          className="text-sm text-gray-700 hover:text-indigo-600 font-medium"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/dashboard/novels/${novel.id}/edit`}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(novel.id, novel.title)}
                          disabled={deleting === novel.id}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-12 text-center">
            <BookOpen className="mx-auto mb-3 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No stories found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? 'Get started by creating your first story'
                : filter === 'published'
                ? 'You have no published stories yet'
                : 'You have no draft stories'}
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              New Story
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
