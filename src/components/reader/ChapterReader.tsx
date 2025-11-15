'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ParagraphCommentButton from './ParagraphCommentButton'
import ParagraphCommentPanel from './ParagraphCommentPanel'

interface Chapter {
  id: number
  chapterNumber: number
  title: string
  content: string
}

interface ChapterInfo {
  id: number
  chapterNumber: number
  title: string
}

interface Novel {
  id: number
  title: string
  slug: string
}

interface ChapterReaderProps {
  novel: Novel
  chapter: Chapter
  chapters: ChapterInfo[]
  totalChapters: number
}

type ReadMode = 'scroll' | 'page'
type BgColor = 'white' | 'beige' | 'dark' | 'green'

const bgColors = {
  white: { bg: 'bg-white', text: 'text-gray-900' },
  beige: { bg: 'bg-[#f5f1e8]', text: 'text-gray-900' },
  dark: { bg: 'bg-[#1a1a1a]', text: 'text-gray-100' },
  green: { bg: 'bg-[#e8f4e8]', text: 'text-gray-900' }
}

const fontSizes = {
  small: { class: 'text-base', lineHeight: 1.75 },
  medium: { class: 'text-lg', lineHeight: 1.8 },
  large: { class: 'text-xl', lineHeight: 1.85 },
  xlarge: { class: 'text-2xl', lineHeight: 1.9 }
}

export default function ChapterReader({ novel, chapter, chapters, totalChapters }: ChapterReaderProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  
  const [readMode, setReadMode] = useState<ReadMode>('scroll')
  const [bgColor, setBgColor] = useState<BgColor>('beige')
  const [fontSize, setFontSize] = useState<keyof typeof fontSizes>('medium')

  const [showToc, setShowToc] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pages, setPages] = useState<string[]>([])

  // ⭐ 段落评论功能
  const [showParagraphComments, setShowParagraphComments] = useState(true)
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null)
  const [paragraphs, setParagraphs] = useState<string[]>([])

  // ⭐ 阅读时长追踪
  const startTimeRef = useRef<number>(Date.now())
  const [isChapterCompleted, setIsChapterCompleted] = useState(false)

  // ⭐ 新增：进入章节时立即记录阅读进度
  useEffect(() => {
    const saveProgress = async () => {
      try {
        await fetch('/api/reading-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId: novel.id,
            chapterId: chapter.id
          })
        })
      } catch (error) {
        console.error('Failed to save reading progress:', error)
      }
    }

    saveProgress()
    // 重置计时器
    startTimeRef.current = Date.now()
    setIsChapterCompleted(false)
  }, [novel.id, chapter.id])

  // ⭐ 阅读时长追踪 - 每分钟保存一次
  useEffect(() => {
    const saveReadingTime = async () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000) // 秒

      if (duration < 10) return // 忽略少于10秒的阅读

      try {
        await fetch('/api/reading-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterId: chapter.id,
            novelId: novel.id,
            duration,
          })
        })
        // 重置计时器
        startTimeRef.current = Date.now()
      } catch (error) {
        console.error('Failed to save reading time:', error)
      }
    }

    // 每分钟保存一次
    const interval = setInterval(saveReadingTime, 60000)

    // 页面卸载时保存
    const handleBeforeUnload = () => {
      saveReadingTime()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveReadingTime()
    }
  }, [chapter.id, novel.id])

  // ⭐ 检测章节完成 - 滚动到底部
  useEffect(() => {
    if (readMode !== 'scroll' || isChapterCompleted) return

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const clientHeight = window.innerHeight

      // 滚动到距离底部100px以内就算完成
      if (scrollHeight - scrollTop - clientHeight < 100) {
        markChapterAsCompleted()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [readMode, isChapterCompleted])

  // ⭐ 检测章节完成 - 翻页到最后一页
  useEffect(() => {
    if (readMode !== 'page' || isChapterCompleted) return

    if (pages.length > 0 && currentPage === pages.length - 1) {
      // 延迟3秒后标记为完成（给用户时间阅读最后一页）
      const timer = setTimeout(() => {
        markChapterAsCompleted()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [readMode, currentPage, pages.length, isChapterCompleted])

  // ⭐ 标记章节为已完成
  const markChapterAsCompleted = async () => {
    if (isChapterCompleted) return

    setIsChapterCompleted(true)

    try {
      await fetch('/api/chapter-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          isCompleted: true,
        })
      })
    } catch (error) {
      console.error('Failed to mark chapter as completed:', error)
    }
  }

  useEffect(() => {
    const savedMode = localStorage.getItem('readMode') as ReadMode
    const savedBg = localStorage.getItem('bgColor') as BgColor
    const savedSize = localStorage.getItem('fontSize') as keyof typeof fontSizes
    const savedShowComments = localStorage.getItem('showParagraphComments')

    if (savedMode) setReadMode(savedMode)
    if (savedBg) setBgColor(savedBg)
    if (savedSize) setFontSize(savedSize)
    if (savedShowComments !== null) setShowParagraphComments(savedShowComments === 'true')
  }, [])

  // ⭐ 段落分割逻辑
  useEffect(() => {
    // 将章节内容按段落分割（使用双换行符）
    const splitParagraphs = chapter.content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)

    setParagraphs(splitParagraphs)
  }, [chapter.content])

  // ✅ 新增：预加载下一章功能
  // ✅ router 是稳定引用，不需要包含在依赖中
  useEffect(() => {
    const nextChapterNumber = chapter.chapterNumber + 1
    if (nextChapterNumber <= totalChapters) {
      router.prefetch(`/novels/${novel.slug}/chapters/${nextChapterNumber}`)
    }
  }, [chapter.chapterNumber, totalChapters, novel.slug])

  useEffect(() => {
    if (readMode === 'page' && contentRef.current) {
      const calculatePages = () => {
        const container = contentRef.current
        if (!container) return

        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'absolute'
        tempDiv.style.visibility = 'hidden'
        tempDiv.style.width = container.offsetWidth + 'px'
        tempDiv.className = `${fontSizes[fontSize].class} leading-loose whitespace-pre-wrap`
        document.body.appendChild(tempDiv)

        const viewportHeight = window.innerHeight - 300
        const words = chapter.content.split(' ')
        const pageArray: string[] = []
        let currentPageText = ''

        for (let i = 0; i < words.length; i++) {
          const testText = currentPageText + (currentPageText ? ' ' : '') + words[i]
          tempDiv.textContent = testText
          
          if (tempDiv.offsetHeight > viewportHeight && currentPageText) {
            pageArray.push(currentPageText)
            currentPageText = words[i]
          } else {
            currentPageText = testText
          }
        }

        if (currentPageText) {
          pageArray.push(currentPageText)
        }

        document.body.removeChild(tempDiv)
        setPages(pageArray)
        setCurrentPage(0)
      }

      calculatePages()
      window.addEventListener('resize', calculatePages)
      return () => window.removeEventListener('resize', calculatePages)
    }
  }, [readMode, chapter.content, fontSize])

  const updateReadMode = (mode: ReadMode) => {
    setReadMode(mode)
    localStorage.setItem('readMode', mode)
    setCurrentPage(0)
  }

  const updateBgColor = (color: BgColor) => {
    setBgColor(color)
    localStorage.setItem('bgColor', color)
  }

  const updateFontSize = (size: keyof typeof fontSizes) => {
    setFontSize(size)
    localStorage.setItem('fontSize', size)
  }

  const toggleParagraphComments = () => {
    const newValue = !showParagraphComments
    setShowParagraphComments(newValue)
    localStorage.setItem('showParagraphComments', String(newValue))
    // 关闭评论时，同时关闭评论面板
    if (!newValue) {
      setActiveParagraphIndex(null)
    }
  }

  const hasPrev = chapter.chapterNumber > 1
  const hasNext = chapter.chapterNumber < totalChapters

  // ✅ 使用 useCallback 包装导航函数，避免不必要的 effect 重新运行
  const goToPrevChapter = useCallback(() => {
    if (chapter.chapterNumber > 1) {
      router.push(`/novels/${novel.slug}/chapters/${chapter.chapterNumber - 1}`)
    }
  }, [novel.slug, chapter.chapterNumber])

  const goToNextChapter = useCallback(() => {
    if (chapter.chapterNumber < totalChapters) {
      router.push(`/novels/${novel.slug}/chapters/${chapter.chapterNumber + 1}`)
    }
  }, [novel.slug, chapter.chapterNumber, totalChapters])

  // ✅ 修改：目录跳转时预加载下一章
  const goToChapter = useCallback((chapterNumber: number) => {
    router.push(`/novels/${novel.slug}/chapters/${chapterNumber}`)
    setShowToc(false)

    // ✅ 预加载跳转章节的下一章
    if (chapterNumber < totalChapters) {
      router.prefetch(`/novels/${novel.slug}/chapters/${chapterNumber + 1}`)
    }
  }, [novel.slug, totalChapters])

  // ✅ 添加导航函数到依赖数组（现在是 useCallback 包装的，引用稳定）
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (readMode === 'page') {
        if (e.key === 'ArrowLeft' && currentPage > 0) {
          setCurrentPage(currentPage - 1)
        } else if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
          setCurrentPage(currentPage + 1)
        } else if (e.key === 'ArrowLeft' && currentPage === 0 && hasPrev) {
          goToPrevChapter()
        } else if (e.key === 'ArrowRight' && currentPage === pages.length - 1 && hasNext) {
          goToNextChapter()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [readMode, currentPage, pages.length, hasPrev, hasNext, goToPrevChapter, goToNextChapter])

  const currentContent = readMode === 'page' && pages.length > 0 ? pages[currentPage] : chapter.content
  const isCommentPanelOpen = activeParagraphIndex !== null

  return (
    <div className={`min-h-screen ${bgColors[bgColor].bg} ${bgColors[bgColor].text} transition-colors`}>
      {/* ✅ 保持原有的顶部导航栏 */}
      <div className={`sticky top-0 z-40 ${bgColors[bgColor].bg} border-b border-gray-200 shadow-sm`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/novels/${novel.slug}`}
              className="flex items-center gap-2 hover:text-[#e8b923] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium hidden md:inline">Back to Novel</span>
            </Link>

            <div className="flex-1 text-center px-4">
              <h1 className="font-bold text-lg md:text-xl truncate">
                Chapter {chapter.chapterNumber}: {chapter.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowToc(!showToc)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Table of Contents"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ 内容区域 - 支持分屏 */}
      <div className="relative">
        {/* 正文区域 - 从中间向左平移 */}
        <div
          className={`container mx-auto px-4 py-8 max-w-4xl transition-all duration-500 ease-in-out ${
            isCommentPanelOpen ? 'transform -translate-x-[15%]' : ''
          }`}
        >
          <div
            ref={contentRef}
            className="w-full"
          >
            <div className={`prose prose-lg max-w-none ${fontSizes[fontSize].class}`} style={{ lineHeight: fontSizes[fontSize].lineHeight }}>
              {showParagraphComments && readMode === 'scroll' ? (
                // 段落评论模式：显示分段内容和评论按钮
                <div className="space-y-6">
                  {paragraphs.map((paragraph, index) => (
                    <div key={index} className="group relative">
                      <div className="leading-loose whitespace-pre-wrap">
                        {paragraph}
                      </div>
                      {/* 段落评论按钮 - 固定在段落右下角 */}
                      <div className="flex justify-end mt-2">
                        <ParagraphCommentButton
                          chapterId={chapter.id}
                          paragraphIndex={index}
                          onClick={() => setActiveParagraphIndex(activeParagraphIndex === index ? null : index)}
                          isActive={activeParagraphIndex === index}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // 普通模式：显示完整内容
                <div className="leading-loose whitespace-pre-wrap">
                  {currentContent}
                </div>
              )}
            </div>
          </div>

          {readMode === 'page' && pages.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 py-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="text-sm font-medium">
                Page {currentPage + 1} / {pages.length}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage === pages.length - 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
            {hasPrev ? (
              <button
                onClick={goToPrevChapter}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#f4d03f] via-[#e8b923] to-[#d4a017] hover:from-[#f5d85a] hover:via-[#f4d03f] hover:to-[#e8b923] text-white font-semibold rounded-lg transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Chapter
              </button>
            ) : (
              <div></div>
            )}

            {hasNext && (
              <button
                onClick={goToNextChapter}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#f4d03f] via-[#e8b923] to-[#d4a017] hover:from-[#f5d85a] hover:via-[#f4d03f] hover:to-[#e8b923] text-white font-semibold rounded-lg transition-all shadow-lg ml-auto"
              >
                Next Chapter
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 评论面板 - 固定在右侧，从右滑入 */}
        {isCommentPanelOpen && (
          <div
            className={`fixed top-0 right-0 h-screen w-[30%] bg-white shadow-2xl border-l border-gray-200 z-50 transition-transform duration-500 ease-in-out ${
              isCommentPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <ParagraphCommentPanel
              novelId={novel.id}
              chapterId={chapter.id}
              paragraphIndex={activeParagraphIndex}
              onClose={() => setActiveParagraphIndex(null)}
            />
          </div>
        )}
      </div>

      {/* Table of Contents */}
      {showToc && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowToc(false)} />
          <div className={`fixed top-0 right-0 h-full w-80 ${bgColors[bgColor].bg} shadow-2xl z-50 overflow-y-auto`}>
            <div className="sticky top-0 bg-inherit border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Table of Contents</h3>
              <button onClick={() => setShowToc(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => goToChapter(ch.chapterNumber)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    ch.chapterNumber === chapter.chapterNumber
                      ? 'bg-[#e8b923] text-white font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm opacity-75">Chapter {ch.chapterNumber}</div>
                  <div className="truncate">{ch.title}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Settings */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowSettings(false)} />
          <div className={`fixed top-0 right-0 h-full w-80 ${bgColors[bgColor].bg} shadow-2xl z-50 overflow-y-auto`}>
            <div className="sticky top-0 bg-inherit border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Reader Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Reading Mode</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateReadMode('scroll')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      readMode === 'scroll' ? 'border-[#e8b923] bg-[#e8b923]/10' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      <div className="text-sm font-medium">Scroll</div>
                    </div>
                  </button>
                  <button
                    onClick={() => updateReadMode('page')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      readMode === 'page' ? 'border-[#e8b923] bg-[#e8b923]/10' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <div className="text-sm font-medium">Page</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Background</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateBgColor('white')} className={`p-3 rounded-lg border-2 transition-all ${bgColor === 'white' ? 'border-[#e8b923] ring-2 ring-[#e8b923]/20' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="w-full h-12 bg-white rounded mb-2 border border-gray-200"></div>
                    <div className="text-xs text-center">White</div>
                  </button>
                  <button onClick={() => updateBgColor('beige')} className={`p-3 rounded-lg border-2 transition-all ${bgColor === 'beige' ? 'border-[#e8b923] ring-2 ring-[#e8b923]/20' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="w-full h-12 bg-[#f5f1e8] rounded mb-2 border border-gray-200"></div>
                    <div className="text-xs text-center">Sepia</div>
                  </button>
                  <button onClick={() => updateBgColor('dark')} className={`p-3 rounded-lg border-2 transition-all ${bgColor === 'dark' ? 'border-[#e8b923] ring-2 ring-[#e8b923]/20' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="w-full h-12 bg-[#1a1a1a] rounded mb-2 border border-gray-200"></div>
                    <div className="text-xs text-center">Dark</div>
                  </button>
                  <button onClick={() => updateBgColor('green')} className={`p-3 rounded-lg border-2 transition-all ${bgColor === 'green' ? 'border-[#e8b923] ring-2 ring-[#e8b923]/20' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="w-full h-12 bg-[#e8f4e8] rounded mb-2 border border-gray-200"></div>
                    <div className="text-xs text-center">Green</div>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Font Size</h4>
                <div className="space-y-2">
                  {(Object.keys(fontSizes) as Array<keyof typeof fontSizes>).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateFontSize(size)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        fontSize === size ? 'border-[#e8b923] bg-[#e8b923]/10' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={fontSizes[size].class}>
                        {size === 'small' && 'Small'}
                        {size === 'medium' && 'Medium'}
                        {size === 'large' && 'Large'}
                        {size === 'xlarge' && 'Extra Large'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ⭐ 段落评论开关 */}
              <div>
                <h4 className="font-semibold mb-3">Paragraph Comments</h4>
                <button
                  onClick={toggleParagraphComments}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    showParagraphComments ? 'border-[#e8b923] bg-[#e8b923]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Show Comment Buttons</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${showParagraphComments ? 'bg-[#e8b923]' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showParagraphComments ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                    </div>
                  </div>
                </button>
                {!showParagraphComments && (
                  <p className="text-xs text-gray-500 mt-2">
                    Paragraph comments are hidden. Enable to see and post comments on specific paragraphs.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}