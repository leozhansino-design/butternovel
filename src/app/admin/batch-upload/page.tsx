'use client'

// app/admin/batch-upload/page.tsx
// 批量上传小说页面

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  parseContentFile,
  validateCoverImage,
  validateContentFile,
  validateParsedNovel,
  BATCH_UPLOAD_LIMITS,
  type NovelUploadData,
  type ParsedNovel
} from '@/lib/batch-upload-utils'

interface UploadStatus {
  status: 'pending' | 'validating' | 'uploading' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error?: string
  novelId?: number
}

export default function BatchUploadPage() {
  const [novels, setNovels] = useState<NovelUploadData[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<Map<string, UploadStatus>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const cancelledRef = useRef(false)

  // 选择文件夹
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 按文件夹组织文件
    const folders = new Map<string, { cover?: File; content?: File }>()

    files.forEach(file => {
      const pathParts = file.webkitRelativePath.split('/')
      if (pathParts.length < 2) return // 跳过不在文件夹中的文件

      const folderName = pathParts[pathParts.length - 2]
      const fileName = pathParts[pathParts.length - 1]

      if (!folders.has(folderName)) {
        folders.set(folderName, {})
      }

      const folder = folders.get(folderName)!
      if (fileName === 'cover.jpg' || fileName === 'cover.png') {
        folder.cover = file
      } else if (fileName === 'content.txt') {
        folder.content = file
      }
    })

    // 转换为NovelUploadData
    const novelData: NovelUploadData[] = []
    for (const [folderName, files] of folders.entries()) {
      if (files.cover && files.content) {
        novelData.push({
          folderName,
          coverFile: files.cover,
          contentFile: files.content
        })
      }
    }

    if (novelData.length > BATCH_UPLOAD_LIMITS.MAX_NOVELS) {
      alert(`最多只能上传${BATCH_UPLOAD_LIMITS.MAX_NOVELS}本小说`)
      return
    }

    // 验证所有文件
    const validatedNovels = await validateNovels(novelData)
    setNovels(validatedNovels)
  }

  // 验证所有小说
  const validateNovels = async (novelData: NovelUploadData[]) => {
    console.log('🚀 [批量上传] 开始验证', novelData.length, '本小说')

    const validatedNovels = await Promise.all(
      novelData.map(async (novel) => {
        console.log('📚 [批量上传] ========== 验证小说:', novel.folderName, '==========')
        try {
          // 验证封面
          const coverValidation = await validateCoverImage(novel.coverFile)

          // 验证content.txt
          const contentValidation = validateContentFile(novel.contentFile)

          // 解析content.txt
          let parsed: ParsedNovel | undefined
          let parseValidation: { valid: boolean; errors: string[]; warnings: string[] } = {
            valid: true,
            errors: [],
            warnings: []
          }

          if (coverValidation.valid && contentValidation.valid) {
            try {
              parsed = await parseContentFile(novel.contentFile)
              parseValidation = validateParsedNovel(parsed)
            } catch (error: any) {
              parseValidation = {
                valid: false,
                errors: [error.message],
                warnings: []
              }
            }
          }

          return {
            ...novel,
            parsed,
            validation: {
              valid: coverValidation.valid && contentValidation.valid && parseValidation.valid,
              errors: [
                ...coverValidation.errors,
                ...contentValidation.errors,
                ...parseValidation.errors
              ],
              warnings: [
                ...coverValidation.warnings,
                ...contentValidation.warnings,
                ...parseValidation.warnings
              ]
            }
          }
        } catch (error: any) {
          return {
            ...novel,
            validation: {
              valid: false,
              errors: [error.message],
              warnings: []
            }
          }
        }
      })
    )

    return validatedNovels
  }

  // 开始上传
  const handleStartUpload = async () => {
    const validNovels = novels.filter(n => n.validation?.valid)
    if (validNovels.length === 0) {
      alert('没有可上传的小说（请检查验证错误）')
      return
    }

    setIsUploading(true)
    setIsPaused(false)
    cancelledRef.current = false

    // 初始化上传状态
    const statuses = new Map<string, UploadStatus>()
    validNovels.forEach(novel => {
      statuses.set(novel.folderName, {
        status: 'pending',
        progress: 0
      })
    })
    setUploadStatuses(statuses)

    // 依次上传
    for (let i = 0; i < validNovels.length; i++) {
      if (cancelledRef.current) break

      // 等待如果暂停
      while (isPaused && !cancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (cancelledRef.current) break

      const novel = validNovels[i]
      await uploadNovel(novel, statuses)
    }

    setIsUploading(false)
  }

  // 上传单本小说
  const uploadNovel = async (novel: NovelUploadData, statuses: Map<string, UploadStatus>) => {
    const updateStatus = (update: Partial<UploadStatus>) => {
      const current = statuses.get(novel.folderName)!
      statuses.set(novel.folderName, { ...current, ...update })
      setUploadStatuses(new Map(statuses))
    }

    try {
      updateStatus({ status: 'uploading', progress: 0 })

      const formData = new FormData()
      formData.append('coverImage', novel.coverFile)
      formData.append('title', novel.parsed!.title)
      formData.append('genre', novel.parsed!.genre)
      formData.append('blurb', novel.parsed!.blurb)
      formData.append('tags', JSON.stringify(novel.parsed!.tags))
      formData.append('chapters', JSON.stringify(novel.parsed!.chapters))

      updateStatus({ progress: 30 })

      const response = await fetch('/api/admin/batch-upload', {
        method: 'POST',
        body: formData
      })

      updateStatus({ progress: 80 })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      updateStatus({
        status: 'completed',
        progress: 100,
        novelId: result.novel.id
      })
    } catch (error: any) {
      updateStatus({
        status: 'failed',
        error: error.message
      })
    }
  }

  // 暂停/继续
  const handleTogglePause = () => {
    setIsPaused(!isPaused)
  }

  // 取消上传
  const handleCancel = () => {
    if (confirm('确定要取消上传吗？已上传的小说不会被删除。')) {
      cancelledRef.current = true
      setIsUploading(false)
      setIsPaused(false)
    }
  }

  // 清空列表
  const handleClear = () => {
    if (isUploading) {
      alert('上传进行中，无法清空列表')
      return
    }
    setNovels([])
    setUploadStatuses(new Map())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validCount = novels.filter(n => n.validation?.valid).length
  const completedCount = Array.from(uploadStatuses.values()).filter(s => s.status === 'completed').length
  const failedCount = Array.from(uploadStatuses.values()).filter(s => s.status === 'failed').length

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 批量上传小说</h1>
        <p className="text-gray-600">
          一次最多上传 {BATCH_UPLOAD_LIMITS.MAX_NOVELS} 本小说。每本小说需包含封面(cover.jpg, 300x400)和内容(content.txt)。
        </p>
      </div>

      {/* 上传区域 */}
      {novels.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-500 transition-colors">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">选择小说文件夹</h3>
          <p className="text-sm text-gray-600 mb-6">
            请选择包含多个小说文件夹的目录，每个文件夹应包含 cover.jpg 和 content.txt
          </p>
          <input
            ref={fileInputRef}
            type="file"
            /* @ts-ignore */
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderSelect}
            className="hidden"
            id="folder-input"
          />
          <label
            htmlFor="folder-input"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            选择文件夹
          </label>
        </div>
      )}

      {/* 小说列表 */}
      {novels.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 统计头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  已选择 {novels.length} 本小说
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  有效: {validCount} | 已上传: {completedCount} | 失败: {failedCount}
                </p>
              </div>
              <div className="flex gap-3">
                {!isUploading && (
                  <>
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      清空列表
                    </button>
                    <button
                      onClick={handleStartUpload}
                      disabled={validCount === 0}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      开始上传
                    </button>
                  </>
                )}
                {isUploading && (
                  <>
                    <button
                      onClick={handleTogglePause}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      {isPaused ? '继续' : '暂停'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      取消
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 小说列表 */}
          <div className="divide-y divide-gray-200">
            {novels.map((novel, index) => {
              const status = uploadStatuses.get(novel.folderName)
              const isValid = novel.validation?.valid
              const errors = novel.validation?.errors || []
              const warnings = novel.validation?.warnings || []

              return (
                <div key={novel.folderName} className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 状态图标 */}
                    <div className="flex-shrink-0">
                      {!status && isValid && (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!status && !isValid && (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                      {status?.status === 'pending' && (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      {status?.status === 'uploading' && (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {status?.status === 'completed' && (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {status?.status === 'failed' && (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 小说信息 */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {novel.parsed?.title || novel.folderName}
                      </h3>
                      {novel.parsed && (
                        <p className="text-sm text-gray-600 mt-1">
                          {novel.parsed.genre} | {novel.parsed.chapters.length} 章节 | {novel.parsed.tags.join(', ')}
                        </p>
                      )}

                      {/* 错误信息 */}
                      {errors.length > 0 && (
                        <div className="mt-2 p-3 bg-red-50 rounded-lg">
                          {errors.map((error, i) => (
                            <p key={i} className="text-sm text-red-700">• {error}</p>
                          ))}
                        </div>
                      )}

                      {/* 警告信息 */}
                      {warnings.length > 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                          {warnings.map((warning, i) => (
                            <p key={i} className="text-sm text-yellow-700">• {warning}</p>
                          ))}
                        </div>
                      )}

                      {/* 上传进度 */}
                      {status?.status === 'uploading' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>上传中...</span>
                            <span>{status.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 上传失败 */}
                      {status?.status === 'failed' && (
                        <div className="mt-2 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-700">上传失败: {status.error}</p>
                        </div>
                      )}

                      {/* 上传成功 */}
                      {status?.status === 'completed' && status.novelId && (
                        <div className="mt-2">
                          <a
                            href={`/admin/novels/${status.novelId}/edit`}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            查看小说 →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 格式说明 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 文件格式要求</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold mb-2">文件夹结构：</p>
            <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
{`novels/
├── novel1/
│   ├── cover.jpg    (必须是300x400像素)
│   └── content.txt
├── novel2/
│   ├── cover.jpg
│   └── content.txt
└── ...`}
            </pre>
          </div>
          <div>
            <p className="font-semibold mb-2">content.txt 格式：</p>
            <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
{`Tags: romance, fantasy, adventure
Title: 小说标题
Genre: Romance
Blurb: 小说简介（10-1000字符）

Chapter 1: 第一章标题
第一章正文内容...

Chapter 2: 第二章标题
第二章正文内容...`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
