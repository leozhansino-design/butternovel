'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  SHORT_NOVEL_GENRES,
  SHORT_NOVEL_LIMITS,
  validateShortNovelLength,
  getShortNovelGenreName,
  formatReadingTime,
  estimateReadingTime,
} from '@/lib/short-novel'
import { CONTENT_RATING_OPTIONS } from '@/lib/content-rating'

interface ShortNovelData {
  id: string
  title: string
  shortNovelGenre: string
  blurb: string
  content: string
  contentRating: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  novelId?: number
}

export default function BatchUploadShortsPage() {
  const [novels, setNovels] = useState<ShortNovelData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add new empty short novel
  const addNovel = () => {
    const newNovel: ShortNovelData = {
      id: `novel-${Date.now()}`,
      title: '',
      shortNovelGenre: 'sweet-romance',
      blurb: '',
      content: '',
      contentRating: 'ALL_AGES',
      status: 'pending',
    }
    setNovels([...novels, newNovel])
  }

  // Update novel field
  const updateNovel = (id: string, field: keyof ShortNovelData, value: string) => {
    setNovels(novels.map(n =>
      n.id === id ? { ...n, [field]: value } : n
    ))
  }

  // Remove novel
  const removeNovel = (id: string) => {
    setNovels(novels.filter(n => n.id !== id))
  }

  // Import from text files
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newNovels: ShortNovelData[] = []

    for (const file of Array.from(files)) {
      try {
        const content = await file.text()
        // Parse the file - expected format:
        // Title: ...
        // Genre: ...
        // Blurb: ...
        // ---
        // (content)

        const lines = content.split('\n')
        let title = ''
        let genre = 'sweet-romance'
        let blurb = ''
        let storyContent = ''
        let inContent = false

        for (const line of lines) {
          if (line.startsWith('Title:')) {
            title = line.replace('Title:', '').trim()
          } else if (line.startsWith('Genre:')) {
            const genreValue = line.replace('Genre:', '').trim().toLowerCase()
            // Find matching genre ID
            const matchedGenre = SHORT_NOVEL_GENRES.find(
              g => g.name.toLowerCase() === genreValue || g.id === genreValue
            )
            if (matchedGenre) genre = matchedGenre.id
          } else if (line.startsWith('Blurb:')) {
            blurb = line.replace('Blurb:', '').trim()
          } else if (line.trim() === '---') {
            inContent = true
          } else if (inContent) {
            storyContent += line + '\n'
          }
        }

        // Use filename as title if not found
        if (!title) {
          title = file.name.replace(/\.txt$/i, '').trim()
        }

        // Use first 200 chars as blurb if not found
        if (!blurb && storyContent) {
          blurb = storyContent.substring(0, 200).trim() + '...'
        }

        newNovels.push({
          id: `novel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          shortNovelGenre: genre,
          blurb,
          content: storyContent.trim(),
          contentRating: 'ALL_AGES',
          status: 'pending',
        })
      } catch (error) {
        console.error(`Failed to parse file ${file.name}:`, error)
      }
    }

    setNovels([...novels, ...newNovels])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload all novels
  const handleUploadAll = async () => {
    const pendingNovels = novels.filter(n => n.status === 'pending')
    if (pendingNovels.length === 0) {
      alert('No novels to upload')
      return
    }

    // Validate all novels
    for (const novel of pendingNovels) {
      if (!novel.title.trim()) {
        alert(`Novel "${novel.id}" is missing a title`)
        return
      }
      if (!novel.content.trim()) {
        alert(`Novel "${novel.title}" is missing content`)
        return
      }
      const validation = validateShortNovelLength(novel.content.length)
      if (!validation.valid) {
        alert(`Novel "${novel.title}": ${validation.message}`)
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < pendingNovels.length; i++) {
      const novel = pendingNovels[i]

      // Update status to uploading
      setNovels(prev => prev.map(n =>
        n.id === novel.id ? { ...n, status: 'uploading' as const } : n
      ))

      try {
        const response = await fetch('/api/admin/batch-upload-shorts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: novel.title,
            shortNovelGenre: novel.shortNovelGenre,
            blurb: novel.blurb,
            content: novel.content,
            contentRating: novel.contentRating,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setNovels(prev => prev.map(n =>
            n.id === novel.id ? { ...n, status: 'success' as const, novelId: data.novel.id } : n
          ))
          successCount++
        } else {
          setNovels(prev => prev.map(n =>
            n.id === novel.id ? { ...n, status: 'error' as const, error: data.error } : n
          ))
          errorCount++
        }
      } catch (error: any) {
        setNovels(prev => prev.map(n =>
          n.id === novel.id ? { ...n, status: 'error' as const, error: error.message } : n
        ))
        errorCount++
      }

      setUploadProgress(Math.round(((i + 1) / pendingNovels.length) * 100))
    }

    setIsUploading(false)
    alert(`Upload complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`)
  }

  const pendingCount = novels.filter(n => n.status === 'pending').length
  const successCount = novels.filter(n => n.status === 'success').length
  const errorCount = novels.filter(n => n.status === 'error').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Upload Short Novels</h1>
          <p className="text-gray-600 mt-1">Upload multiple short novels at once</p>
        </div>
        <Link
          href="/admin/batch-upload"
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Switch to Regular Novels
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{novels.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-700">{successCount}</div>
          <div className="text-sm text-green-600">Uploaded</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-700">{errorCount}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={addNovel}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
        >
          + Add Novel Manually
        </button>

        <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium cursor-pointer">
          Import from Files (.txt)
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            multiple
            onChange={handleFileImport}
            className="hidden"
          />
        </label>

        {pendingCount > 0 && (
          <button
            onClick={handleUploadAll}
            disabled={isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 ml-auto"
          >
            {isUploading ? `Uploading... ${uploadProgress}%` : `Upload All (${pendingCount})`}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Import Format Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">File Format for Import</h3>
        <pre className="text-sm text-blue-800 font-mono">
{`Title: Your Short Novel Title
Genre: sweet-romance
Blurb: A brief description of your story...
---
Your story content goes here...
The entire story in one file.`}
        </pre>
        <p className="text-sm text-blue-600 mt-2">
          Available genres: {SHORT_NOVEL_GENRES.map(g => g.id).join(', ')}
        </p>
      </div>

      {/* Novels List */}
      {novels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No short novels added yet</h2>
          <p className="text-gray-500">Add novels manually or import from text files</p>
        </div>
      ) : (
        <div className="space-y-6">
          {novels.map((novel, index) => {
            const contentValidation = validateShortNovelLength(novel.content.length)
            const readingTime = estimateReadingTime(novel.content.length)

            return (
              <div
                key={novel.id}
                className={`bg-white rounded-lg border-2 p-6 ${
                  novel.status === 'success'
                    ? 'border-green-300 bg-green-50'
                    : novel.status === 'error'
                    ? 'border-red-300 bg-red-50'
                    : novel.status === 'uploading'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      novel.status === 'success'
                        ? 'bg-green-200 text-green-800'
                        : novel.status === 'error'
                        ? 'bg-red-200 text-red-800'
                        : novel.status === 'uploading'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {novel.status === 'success' && `Uploaded (ID: ${novel.novelId})`}
                      {novel.status === 'error' && `Error: ${novel.error}`}
                      {novel.status === 'uploading' && 'Uploading...'}
                      {novel.status === 'pending' && 'Pending'}
                    </span>
                  </div>
                  {novel.status === 'pending' && (
                    <button
                      onClick={() => removeNovel(novel.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {novel.status === 'pending' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={novel.title}
                          onChange={(e) => updateNovel(novel.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Short novel title"
                          maxLength={SHORT_NOVEL_LIMITS.TITLE_MAX}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {novel.title.length} / {SHORT_NOVEL_LIMITS.TITLE_MAX}
                        </div>
                      </div>

                      {/* Genre */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Genre *
                        </label>
                        <select
                          value={novel.shortNovelGenre}
                          onChange={(e) => updateNovel(novel.id, 'shortNovelGenre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {SHORT_NOVEL_GENRES.map((genre) => (
                            <option key={genre.id} value={genre.id}>
                              {genre.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Content Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Content Rating
                        </label>
                        <select
                          value={novel.contentRating}
                          onChange={(e) => updateNovel(novel.id, 'contentRating', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {CONTENT_RATING_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Blurb */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Blurb *
                        </label>
                        <textarea
                          value={novel.blurb}
                          onChange={(e) => updateNovel(novel.id, 'blurb', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                          placeholder="Short description"
                          maxLength={1000}
                        />
                      </div>
                    </div>

                    {/* Right Column - Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content * ({SHORT_NOVEL_LIMITS.MIN_CHARACTERS.toLocaleString()} - {SHORT_NOVEL_LIMITS.MAX_CHARACTERS.toLocaleString()} chars)
                      </label>
                      <textarea
                        value={novel.content}
                        onChange={(e) => updateNovel(novel.id, 'content', e.target.value)}
                        rows={12}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none font-serif ${
                          contentValidation.valid
                            ? 'border-gray-300 focus:ring-amber-500'
                            : 'border-red-300 focus:ring-red-500'
                        }`}
                        placeholder="Paste your short novel content here..."
                      />
                      <div className="flex justify-between mt-1">
                        <span className={`text-sm ${contentValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {novel.content.length.toLocaleString()} characters
                          {novel.content.length > 0 && ` (~${formatReadingTime(readingTime)})`}
                        </span>
                        {!contentValidation.valid && novel.content.length > 0 && (
                          <span className="text-sm text-red-600">{contentValidation.message}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <p><strong>Title:</strong> {novel.title}</p>
                    <p><strong>Genre:</strong> {getShortNovelGenreName(novel.shortNovelGenre)}</p>
                    <p><strong>Characters:</strong> {novel.content.length.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
