'use client'

import { useState } from 'react'
import { Upload, BookOpen, Plus, X } from 'lucide-react'
import Image from 'next/image'

// 分类数据（Genres）
const genres = [
  { id: 1, name: 'Fantasy' },
  { id: 2, name: 'Urban' },
  { id: 3, name: 'Romance' },
  { id: 4, name: 'Sci-Fi' },
  { id: 5, name: 'Mystery' },
  { id: 6, name: 'Action' },
  { id: 7, name: 'Adventure' },
  { id: 8, name: 'Horror' },
]

// 字数限制
const LIMITS = {
  TITLE_MAX: 120,
  BLURB_MAX: 3000,
  CHAPTER_TITLE_MAX: 100,
}

// 图片规格限制
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
}

export default function NovelUploadForm() {
  const [uploading, setUploading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [showChapterForm, setShowChapterForm] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    coverImage: '',
    categoryId: '',
    blurb: '',
    status: 'ONGOING',
    isPublished: false,
    chapters: [] as any[],
  })
  
  const [chapters, setChapters] = useState<Chapter[]>([])
  
  const [currentChapter, setCurrentChapter] = useState({
    title: '',
    content: '',
  })

  // 处理封面上传
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!IMAGE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
      alert('❌ Invalid file type. Please upload JPG, PNG, or WebP image.')
      e.target.value = ''
      return
    }

    if (file.size > IMAGE_LIMITS.MAX_SIZE) {
      alert(`❌ File too large. Maximum size is ${IMAGE_LIMITS.MAX_SIZE / 1024 / 1024}MB.\nYour file: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
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
        alert(`❌ Invalid image size.\nRequired: ${IMAGE_LIMITS.REQUIRED_WIDTH}x${IMAGE_LIMITS.REQUIRED_HEIGHT}px (exactly)\nYour image: ${width}x${height}px\n\nPlease resize your image to exactly 300x400 pixels.`)
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
      
      alert(`✅ Image validated successfully!\nSize: ${width}x${height}px\nFile size: ${(file.size / 1024).toFixed(0)}KB`)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      alert('❌ Failed to load image. Please try another file.')
      e.target.value = ''
    }
    
    img.src = objectUrl
  }

  // 添加章节
  const handleAddChapter = () => {
    if (!currentChapter.title || !currentChapter.content) {
      alert('Please fill in chapter title and content')
      return
    }
    
    const newChapter: Chapter = {
      id: Math.random().toString(36).substr(2, 9),
      number: chapters.length + 1,
      title: currentChapter.title,
      content: currentChapter.content,
      wordCount: currentChapter.content.split(/\s+/).filter(w => w).length,
    }
    
    setChapters([...chapters, newChapter])
    setCurrentChapter({ title: '', content: '' })
    setShowChapterForm(false)
  }

  // 删除章节
  const handleDeleteChapter = (id: string) => {
    const filtered = chapters.filter(c => c.id !== id)
    // 重新编号
    const renumbered = filtered.map((ch, index) => ({
      ...ch,
      number: index + 1
    }))
    setChapters(renumbered)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 [Form] Starting submission...')
    
    // 验证
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    
    if (!formData.coverImage) {
      alert('Please upload a cover image')
      return
    }
    
    if (!formData.categoryId) {
      alert('Please select a category')
      return
    }
    
    if (!formData.blurb.trim()) {
      alert('Please enter a description')
      return
    }

    if (chapters.length === 0) {
      alert('Please add at least one chapter')
      return
    }

    setUploading(true)

    try {
      console.log('📤 [Form] Sending request to API...')

      const response = await fetch('/api/admin/novels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          coverImage: formData.coverImage,
          categoryId: formData.categoryId,
          blurb: formData.blurb,
          status: formData.status,
          isPublished: formData.isPublished,
          chapters: chapters.map(ch => ({
            title: ch.title,
            content: ch.content,
          })),
        }),
      })

      console.log('📨 [Form] Response status:', response.status)

      const data = await response.json()
      console.log('📨 [Form] Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      console.log('✅ [Form] Upload successful!')

      alert(`✅ Success!\n\nNovel "${data.novel.title}" has been uploaded!\n\nID: ${data.novel.id}\nChapters: ${data.novel.totalChapters}\nWords: ${data.novel.wordCount.toLocaleString()}`)
      
      // 重置表单
      setFormData({
        title: '',
        coverImage: '',
        categoryId: '',
        blurb: '',
        status: 'ONGOING',
        isPublished: false,
        chapters: [],
      })
      setChapters([])
      setCoverPreview('')

    } catch (error: any) {
      console.error('❌ [Form] Upload error:', error)
      alert('❌ Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen size={20} />
          Basic Information
        </h2>
        
        <div className="space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Novel Title *
            </label>
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
              placeholder="Enter novel title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={LIMITS.TITLE_MAX}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {formData.title.length} / {LIMITS.TITLE_MAX} characters
              </p>
              {formData.title.length >= LIMITS.TITLE_MAX && (
                <p className="text-xs text-red-500 font-medium">
                  Maximum length reached
                </p>
              )}
            </div>
          </div>

          {/* 封面上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image *
            </label>
            
            {coverPreview ? (
              <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 border-gray-300">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverPreview('')
                    setFormData({ ...formData, coverImage: '' })
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-48 h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="text-gray-400 mb-2" size={32} />
                <span className="text-sm text-gray-500 font-medium">Upload Cover</span>
                <span className="text-xs text-red-500 font-semibold mt-2">Required:</span>
                <span className="text-xs text-gray-700 font-medium">300x400px (exactly)</span>
                <span className="text-xs text-gray-400 mt-1">Max 2MB</span>
                <span className="text-xs text-gray-400">JPG, PNG, WebP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre *
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a genre</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description / Blurb *
            </label>
            <textarea
              required
              value={formData.blurb}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= LIMITS.BLURB_MAX) {
                  setFormData({ ...formData, blurb: value })
                }
              }}
              rows={10}
              placeholder="Write a compelling description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={LIMITS.BLURB_MAX}
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${
                formData.blurb.length > LIMITS.BLURB_MAX * 0.9 
                  ? 'text-orange-500 font-medium' 
                  : 'text-gray-500'
              }`}>
                {formData.blurb.length} / {LIMITS.BLURB_MAX} characters
              </p>
              {formData.blurb.length >= LIMITS.BLURB_MAX && (
                <p className="text-xs text-red-500 font-medium">
                  Maximum length reached
                </p>
              )}
            </div>
          </div>

          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
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

          {/* 发布状态 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Publish immediately (uncheck to save as draft)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 章节管理 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={20} />
            Chapters ({chapters.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowChapterForm(!showChapterForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Chapter
          </button>
        </div>

        {/* 添加章节表单 */}
        {showChapterForm && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Title
              </label>
              <input
                type="text"
                value={currentChapter.title}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= LIMITS.CHAPTER_TITLE_MAX) {
                    setCurrentChapter({ ...currentChapter, title: value })
                  }
                }}
                placeholder="e.g., Chapter 1: The Beginning"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={LIMITS.CHAPTER_TITLE_MAX}
              />
              <p className="text-xs text-gray-500 mt-1">
                {currentChapter.title.length} / {LIMITS.CHAPTER_TITLE_MAX} characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Content
              </label>
              <textarea
                value={currentChapter.content}
                onChange={(e) => setCurrentChapter({ ...currentChapter, content: e.target.value })}
                rows={10}
                placeholder="Write your chapter content here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Word count: {currentChapter.content.split(/\s+/).filter(w => w).length}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddChapter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Chapter
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChapterForm(false)
                  setCurrentChapter({ title: '', content: '' })
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 章节列表 */}
        {chapters.length > 0 ? (
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Chapter {chapter.number}: {chapter.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {chapter.wordCount.toLocaleString()} words
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="mx-auto mb-2 text-gray-400" size={48} />
            <p className="font-medium">No chapters added yet</p>
            <p className="text-sm">Click "Add Chapter" to start</p>
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {uploading ? 'Uploading...' : formData.isPublished ? 'Publish Novel' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}