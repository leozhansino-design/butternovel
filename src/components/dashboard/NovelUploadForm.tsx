'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

// Category data (Genres)
const genres = [
  { id: 1, name: 'Fantasy' },
  { id: 2, name: 'Romance' },
  { id: 3, name: 'Urban' },
  { id: 4, name: 'Sci-Fi' },
  { id: 5, name: 'Mystery' },
  { id: 6, name: 'Horror' },
  { id: 7, name: 'Adventure' },
  { id: 8, name: 'Historical' },
  { id: 9, name: 'Crime' },
  { id: 10, name: 'LGBTQ+' },
  { id: 11, name: 'Paranormal' },
  { id: 12, name: 'System' },
  { id: 13, name: 'Reborn' },
  { id: 14, name: 'Revenge' },
  { id: 15, name: 'Fanfiction' },
]

// Limits
const LIMITS = {
  TITLE_MAX: 120,
  BLURB_MAX: 1000, // Changed from 3000 to 1000
  CHAPTER_TITLE_MAX: 100,
  CHAPTER_WORDS_MAX: 5000,
}

// Image limits
const IMAGE_LIMITS = {
  MAX_SIZE: 2 * 1024 * 1024,
  REQUIRED_WIDTH: 300,
  REQUIRED_HEIGHT: 400,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}

type Chapter = {
  id: string
  number: number
  title: string
  content: string
  wordCount: number
  isPublished: boolean
}

export default function NovelUploadForm() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string>('')

  const [formData, setFormData] = useState({
    title: '',
    coverImage: '',
    categoryId: '',
    blurb: '',
    status: 'ONGOING',
    isPublished: false,
  })

  const [chapters, setChapters] = useState<Chapter[]>([])

  // Handle cover upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!IMAGE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, or WebP image.')
      e.target.value = ''
      return
    }

    if (file.size > IMAGE_LIMITS.MAX_SIZE) {
      alert(`File too large. Maximum size is ${IMAGE_LIMITS.MAX_SIZE / 1024 / 1024}MB.`)
      e.target.value = ''
      return
    }

    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const width = img.width
      const height = img.height

      URL.revokeObjectURL(objectUrl)

      if (width !== IMAGE_LIMITS.REQUIRED_WIDTH || height !== IMAGE_LIMITS.REQUIRED_HEIGHT) {
        alert(
          `Invalid image size.\nRequired: ${IMAGE_LIMITS.REQUIRED_WIDTH}x${IMAGE_LIMITS.REQUIRED_HEIGHT}px\nYour image: ${width}x${height}px`
        )
        e.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setCoverPreview(base64)
        setFormData({ ...formData, coverImage: base64 })
      }
      reader.readAsDataURL(file)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      alert('Failed to load image. Please try another file.')
      e.target.value = ''
    }

    img.src = objectUrl
  }

  // Delete chapter
  const handleDeleteChapter = (id: string) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      const filtered = chapters.filter((c) => c.id !== id)
      const renumbered = filtered.map((ch, index) => ({
        ...ch,
        number: index + 1,
      }))
      setChapters(renumbered)
    }
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent, publishNow: boolean = false) => {
    e.preventDefault()

    // Validate
    if (!formData.title.trim() || !formData.coverImage || !formData.categoryId || !formData.blurb.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (publishNow && chapters.length === 0) {
      alert('Please add at least one chapter before publishing')
      return
    }

    if (publishNow) {
      const hasPublishedChapter = chapters.some((ch) => ch.isPublished)
      if (!hasPublishedChapter) {
        alert('Please publish at least one chapter before publishing the novel')
        return
      }
    }

    setUploading(true)

    try {
      const response = await fetch('/api/dashboard/novels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          coverImage: formData.coverImage,
          categoryId: parseInt(formData.categoryId),
          blurb: formData.blurb,
          status: formData.status,
          isPublished: publishNow,
          chapters: chapters.map((ch) => ({
            title: ch.title,
            content: ch.content,
            isPublished: ch.isPublished,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      alert(`Success! Novel "${data.novel.title}" has been ${publishNow ? 'published' : 'saved as draft'}!`)
      router.push('/dashboard/novels')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const blurbCharCount = formData.blurb.length
  const blurbWarning = blurbCharCount > 900
  const blurbError = blurbCharCount >= LIMITS.BLURB_MAX

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="grid grid-cols-2 gap-6">
      {/* Left Column - Novel Details */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Novel Details</h2>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= LIMITS.TITLE_MAX) {
                    setFormData({ ...formData, title: value })
                  }
                }}
                placeholder="Enter your story title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                maxLength={LIMITS.TITLE_MAX}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length} / {LIMITS.TITLE_MAX} characters
              </p>
            </div>

            {/* Blurb */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                value={formData.blurb}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= LIMITS.BLURB_MAX) {
                    setFormData({ ...formData, blurb: value })
                  }
                }}
                rows={8}
                placeholder="Write a compelling description for your story..."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none text-sm ${
                  blurbError
                    ? 'border-red-500 focus:ring-red-500'
                    : blurbWarning
                    ? 'border-yellow-500 focus:ring-yellow-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                maxLength={LIMITS.BLURB_MAX}
              />
              <div className="flex items-center justify-between mt-1">
                <p
                  className={`text-xs font-medium ${
                    blurbError ? 'text-red-600' : blurbWarning ? 'text-yellow-600' : 'text-gray-500'
                  }`}
                >
                  {blurbCharCount} / {LIMITS.BLURB_MAX} characters
                </p>
                {blurbError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Limit reached
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Select a genre</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>

              {coverPreview ? (
                <div className="relative w-36 h-48 rounded-lg overflow-hidden border border-gray-300">
                  <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreview('')
                      setFormData({ ...formData, coverImage: '' })
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-36 h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                  <Upload className="text-gray-400 mb-1" size={24} />
                  <span className="text-xs text-gray-500 font-medium">Upload Cover</span>
                  <span className="text-xs text-gray-400 mt-1">300x400px</span>
                  <span className="text-xs text-gray-400">Max 2MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ONGOING"
                    checked={formData.status === 'ONGOING'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Ongoing</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="COMPLETED"
                    checked={formData.status === 'COMPLETED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Completed</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Table of Contents */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Chapters ({chapters.length})</h2>
            <button
              type="button"
              onClick={() => {
                alert('Feature coming soon: This will redirect to a full-screen writing page')
                // In the future, this would create a temporary chapter and redirect to write page
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Chapter
            </button>
          </div>

          {/* Chapters List */}
          {chapters.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {chapter.number}. {chapter.title}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          chapter.isPublished
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {chapter.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{chapter.wordCount.toLocaleString()} words</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => alert('Edit functionality coming soon')}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="text-gray-400" size={24} />
              </div>
              <p className="text-sm font-medium mb-1">No chapters yet</p>
              <p className="text-xs text-gray-400">Add your first chapter to get started</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-3">
            <button
              type="submit"
              disabled={uploading}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
            >
              {uploading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as any, true)}
              disabled={uploading || chapters.length === 0}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
            >
              {uploading ? 'Publishing...' : 'Publish Novel'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              {chapters.length === 0
                ? 'Add at least one published chapter to publish the novel'
                : 'Make sure at least one chapter is published'}
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}
