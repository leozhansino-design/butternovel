// src/components/novel/ChapterPreview.tsx
// 第一章预览组件 - 只显示 200-300 字，带渐变效果
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

type ChapterPreviewProps = {
  chapterId: number
  chapterNumber: number
  chapterTitle: string
  novelSlug: string
}

async function getChapterContent(chapterId: number) {
  // 🔧 FIX: Only run database queries in Node.js environment
  if (typeof window !== 'undefined' || !prisma) {
    console.warn('ChapterPreview: Skipping database query (client-side or prisma unavailable)');
    return null;
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      content: true,
    },
  })
  return chapter?.content || null
}

/**
 * 截取指定字数（中文字符数）
 * 中文字符算1个字，英文单词算1个字
 */
function truncateByWords(text: string, wordCount: number): string {
  // 移除多余的空白字符
  const cleaned = text.trim()

  let count = 0
  let result = ''

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    // 中文字符（CJK统一表意文字）
    if (/[\u4e00-\u9fa5]/.test(char)) {
      count++
      result += char
      if (count >= wordCount) break
    }
    // 英文字符
    else if (/[a-zA-Z]/.test(char)) {
      // 读取整个英文单词
      let word = char
      while (i + 1 < cleaned.length && /[a-zA-Z]/.test(cleaned[i + 1])) {
        i++
        word += cleaned[i]
      }
      count++
      result += word
      if (count >= wordCount) break
    }
    // 其他字符（标点、空格等）直接添加
    else {
      result += char
    }
  }

  return result
}

export default async function ChapterPreview({
  chapterId,
  chapterNumber,
  chapterTitle,
  novelSlug,
}: ChapterPreviewProps) {
  const content = await getChapterContent(chapterId)

  if (!content) {
    return null
  }

  // 截取 250 字左右
  const preview = truncateByWords(content, 250)

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* 章节标题 */}
          <div className="mb-10">
            <div className="text-sm text-blue-600 mb-2 font-semibold tracking-wider">
              CHAPTER {chapterNumber}
            </div>
            <h3 className="text-4xl font-bold text-gray-900">
              {chapterTitle}
            </h3>
          </div>

          {/* 内容预览区域 - 带蓝色渐变遮罩 */}
          <div className="relative">
            {/* 预览内容 */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {preview}
              </div>
            </div>

            {/* 渐变遮罩效果 - 白色渐变 */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
          </div>

          {/* Continue Reading 按钮 - 蓝色主题 */}
          <div className="mt-10 text-center">
            <Link
              href={`/novels/${novelSlug}/chapters/${chapterNumber}`}
              className="btn-primary inline-flex items-center gap-3 px-10 py-4 text-white font-semibold rounded-xl text-lg hover:scale-[1.02]"
            >
              Continue Reading
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
