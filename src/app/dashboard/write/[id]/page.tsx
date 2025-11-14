'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, AlertCircle, MoreVertical } from 'lucide-react'
import Link from 'next/link'

const WORD_LIMIT = 5000
const WARNING_THRESHOLD = 4500
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export default function WritePage() {
  const params = useParams()
  const router = useRouter()
  const chapterId = params.id as string

  const [chapter, setChapter] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Calculate word count
  const wordCount = content.trim().split(/\s+/).filter((w) => w).length
  const isNearLimit = wordCount >= WARNING_THRESHOLD
  const isOverLimit = wordCount >= WORD_LIMIT

  // Fetch chapter
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const response = await fetch(`/api/dashboard/chapters/${chapterId}`)
        if (response.ok) {
          const data = await response.json()
          setChapter(data.chapter)
          setTitle(data.chapter.title)
          setContent(data.chapter.content)
          setIsPublished(data.chapter.isPublished)
        } else {
          alert('Failed to load chapter')
          router.push('/dashboard/novels')
        }
      } catch (error) {
        console.error('Failed to fetch chapter:', error)
        alert('An error occurred')
        router.push('/dashboard/novels')
      }
    }
    fetchChapter()
  }, [chapterId, router])

  // Auto-save
  const autoSave = useCallback(async () => {
    if (!title.trim() || !content.trim()) return
    if (saving) return

    setSaving(true)
    try {
      const response = await fetch(`/api/dashboard/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          isPublished: false, // Keep as draft when auto-saving
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [chapterId, title, content, saving])

  // Auto-save timer
  useEffect(() => {
    if (!title.trim() || !content.trim()) return

    const timer = setInterval(() => {
      autoSave()
    }, AUTO_SAVE_INTERVAL)

    return () => clearInterval(timer)
  }, [title, content, autoSave])

  // Save draft manually
  const handleSaveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in title and content')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/dashboard/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          isPublished: false,
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        alert('Draft saved successfully!')
      } else {
        const data = await response.json()
        alert(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  // Publish chapter
  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please enter a chapter title')
      return
    }

    if (!content.trim()) {
      alert('Please enter chapter content')
      return
    }

    if (wordCount > WORD_LIMIT) {
      alert(`Chapter exceeds maximum word limit of ${WORD_LIMIT.toLocaleString()} words`)
      return
    }

    setPublishing(true)
    try {
      const response = await fetch(`/api/dashboard/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          isPublished: true,
        }),
      })

      if (response.ok) {
        alert('Chapter published successfully!')
        setIsPublished(true)
        router.push(`/dashboard/novels/${chapter.novel.id}/chapters`)
      } else {
        const data = await response.json()
        alert(`Failed to publish: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to publish:', error)
      alert('An error occurred')
    } finally {
      setPublishing(false)
    }
  }

  // Prevent input if over limit
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const newWordCount = newContent.trim().split(/\s+/).filter((w) => w).length

    if (newWordCount <= WORD_LIMIT) {
      setContent(newContent)
    }
  }

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000) // seconds

    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!chapter) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top toolbar - minimal and clean */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/novels/${chapter.novel.id}/chapters`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="text-sm text-gray-500">
            {chapter.novel.title}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Word count */}
          <span
            className={`text-sm ${
              isOverLimit
                ? 'text-red-600 font-medium'
                : isNearLimit
                ? 'text-orange-500'
                : 'text-gray-500'
            }`}
          >
            {wordCount.toLocaleString()} / {WORD_LIMIT.toLocaleString()} words
          </span>

          {/* Auto-save indicator */}
          {lastSaved && (
            <span className="text-xs text-gray-400">
              {saving ? 'Saving...' : `Saved ${formatLastSaved(lastSaved)}`}
            </span>
          )}

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={saving || !title.trim() || !content.trim()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* Publish */}
          {!isPublished && (
            <button
              onClick={handlePublish}
              disabled={publishing || isOverLimit || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* Editor area - maximum space */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Warning Alert */}
          {isNearLimit && (
            <div
              className={`mb-8 p-4 rounded-lg border ${
                isOverLimit
                  ? 'bg-red-50 border-red-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className={`flex-shrink-0 mt-0.5 ${
                    isOverLimit ? 'text-red-600' : 'text-orange-600'
                  }`}
                />
                <div>
                  <p
                    className={`font-medium ${
                      isOverLimit ? 'text-red-800' : 'text-orange-800'
                    }`}
                  >
                    {isOverLimit ? 'Word limit reached!' : 'Approaching word limit'}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      isOverLimit ? 'text-red-700' : 'text-orange-700'
                    }`}
                  >
                    {isOverLimit
                      ? `You've reached the maximum word limit of ${WORD_LIMIT.toLocaleString()} words. Please reduce your content to publish.`
                      : `You're approaching the maximum word limit. Consider wrapping up this chapter soon.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chapter Title"
            className="w-full text-3xl font-bold border-none outline-none mb-8 placeholder-gray-300"
            maxLength={100}
          />

          {/* Content editor */}
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing your story..."
            className="w-full min-h-screen text-lg leading-relaxed border-none outline-none resize-none placeholder-gray-300"
            style={{ fontFamily: 'Georgia, serif' }}
          />
        </div>
      </div>
    </div>
  )
}
