'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react'
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

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Top Toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Back Button */}
          <Link
            href={`/dashboard/novels/${chapter.novel.id}/chapters`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </Link>

          {/* Center: Novel Title & Chapter */}
          <div className="text-center">
            <p className="text-sm text-gray-600">{chapter.novel.title}</p>
            <p className="text-xs text-gray-500">
              Chapter {chapter.chapterNumber} {isPublished ? '(Published)' : '(Draft)'}
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Word Count */}
            <div className="text-right">
              <p
                className={`text-sm font-medium ${
                  isOverLimit
                    ? 'text-red-600'
                    : isNearLimit
                    ? 'text-orange-600'
                    : 'text-gray-900'
                }`}
              >
                {wordCount.toLocaleString()} / {WORD_LIMIT.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">words</p>
            </div>

            {/* Save Draft */}
            <button
              onClick={handleSaveDraft}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            {/* Publish */}
            {!isPublished && (
              <button
                onClick={handlePublish}
                disabled={publishing || isOverLimit || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Send size={18} />
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Warning Alert */}
          {isNearLimit && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                isOverLimit
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-orange-50 border-orange-200 text-orange-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {isOverLimit ? 'Word limit reached!' : 'Approaching word limit'}
                  </p>
                  <p className="text-sm mt-1">
                    {isOverLimit
                      ? `You've reached the maximum word limit of ${WORD_LIMIT.toLocaleString()} words. Please reduce your content to publish.`
                      : `You're approaching the maximum word limit. Consider wrapping up this chapter soon.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter Title */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter Title"
              className="w-full px-4 py-3 text-2xl font-bold border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
              maxLength={100}
            />
          </div>

          {/* Chapter Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing your chapter here..."
              className="w-full min-h-[600px] text-lg leading-relaxed focus:outline-none resize-none font-serif"
              style={{ fontSize: '18px', lineHeight: '1.8' }}
            />
          </div>

          {/* Last Saved Info */}
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Auto-saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
