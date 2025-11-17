// lib/batch-upload-utils.ts
// 🦋 ButterNovel - Batch Upload Utility Functions

import { normalizeTag } from './tags'

export const BATCH_UPLOAD_LIMITS = {
  MAX_NOVELS: 100,
  MIN_CHAPTERS: 1,
  MAX_CHAPTERS: 200,
  COVER_WIDTH: 300,
  COVER_HEIGHT: 400,
  MAX_COVER_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CONTENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const

/**
 * 解析的小说数据结构
 */
export interface ParsedNovel {
  title: string
  genre: string
  blurb: string
  tags: string[]
  chapters: Array<{
    number: number
    title: string
    content: string
  }>
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 批量上传的单个小说数据
 */
export interface NovelUploadData {
  folderName: string
  coverFile: File
  contentFile: File
  parsed?: ParsedNovel
  validation?: ValidationResult
}

/**
 * 解析content.txt文件
 *
 * 格式：
 * Tags: tag1, tag2, tag3
 * Title: 小说标题
 * Genre: Romance
 * Blurb: 小说简介...
 *
 * Chapter 1: 章节标题
 * 章节正文内容...
 *
 * Chapter 2: 章节标题
 * 章节正文内容...
 */
export async function parseContentFile(file: File): Promise<ParsedNovel> {
  const text = await file.text()
  const lines = text.split('\n')

  // 解析元数据（前4行）
  const tagsLine = lines[0]?.trim() || ''
  const titleLine = lines[1]?.trim() || ''
  const genreLine = lines[2]?.trim() || ''
  const blurbLine = lines[3]?.trim() || ''

  if (!tagsLine.startsWith('Tags:')) {
    throw new Error('第1行必须是 "Tags: tag1, tag2, tag3"')
  }
  if (!titleLine.startsWith('Title:')) {
    throw new Error('第2行必须是 "Title: 小说标题"')
  }
  if (!genreLine.startsWith('Genre:')) {
    throw new Error('第3行必须是 "Genre: Romance"')
  }
  if (!blurbLine.startsWith('Blurb:')) {
    throw new Error('第4行必须是 "Blurb: 小说简介"')
  }

  // 提取元数据
  const tagsRaw = tagsLine.substring(5).trim()
  const tags = tagsRaw
    .split(',')
    .map(t => normalizeTag(t.trim()))
    .filter(t => t.length > 0)
    .slice(0, 20) // 最多20个tags

  const title = titleLine.substring(6).trim()
  const genre = genreLine.substring(6).trim()
  const blurb = blurbLine.substring(6).trim()

  if (!title) throw new Error('标题不能为空')
  if (!genre) throw new Error('分类不能为空')
  if (!blurb) throw new Error('简介不能为空')

  // 解析章节（从第5行开始，跳过空行）
  const chapters: ParsedNovel['chapters'] = []
  let currentChapter: { number: number; title: string; content: string } | null = null

  // 正则匹配：Chapter 1: 标题 或 Chapter 1：标题
  const chapterRegex = /^Chapter\s+(\d+)[：:]\s*(.+)$/i

  for (let i = 4; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // 跳过空行（除非在章节内容中）
    if (!trimmedLine && !currentChapter) {
      continue
    }

    // 检测章节标题
    const match = trimmedLine.match(chapterRegex)
    if (match) {
      // 保存上一个章节
      if (currentChapter) {
        chapters.push({
          ...currentChapter,
          content: currentChapter.content.trim()
        })
      }

      // 开始新章节
      currentChapter = {
        number: parseInt(match[1], 10),
        title: match[2].trim(),
        content: ''
      }
    } else if (currentChapter) {
      // 添加到当前章节内容
      currentChapter.content += line + '\n'
    }
  }

  // 保存最后一个章节
  if (currentChapter) {
    chapters.push({
      ...currentChapter,
      content: currentChapter.content.trim()
    })
  }

  if (chapters.length === 0) {
    throw new Error('至少需要1个章节')
  }

  // 验证章节编号连续
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].number !== i + 1) {
      throw new Error(`章节编号不连续：期望Chapter ${i + 1}，实际为Chapter ${chapters[i].number}`)
    }
  }

  return {
    title,
    genre,
    blurb,
    tags,
    chapters
  }
}

/**
 * 验证封面图片尺寸
 */
export async function validateCoverImage(file: File): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    errors.push('封面必须是图片文件')
    return { valid: false, errors, warnings }
  }

  // 检查文件大小
  if (file.size > BATCH_UPLOAD_LIMITS.MAX_COVER_SIZE) {
    errors.push(`封面大小超过限制（最大${BATCH_UPLOAD_LIMITS.MAX_COVER_SIZE / 1024 / 1024}MB）`)
  }

  // 检查图片尺寸
  try {
    const dimensions = await getImageDimensions(file)
    if (dimensions.width !== BATCH_UPLOAD_LIMITS.COVER_WIDTH ||
        dimensions.height !== BATCH_UPLOAD_LIMITS.COVER_HEIGHT) {
      errors.push(
        `封面尺寸必须是${BATCH_UPLOAD_LIMITS.COVER_WIDTH}x${BATCH_UPLOAD_LIMITS.COVER_HEIGHT}，` +
        `当前为${dimensions.width}x${dimensions.height}`
      )
    }
  } catch (error) {
    errors.push('无法读取图片尺寸')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证content.txt文件
 */
export function validateContentFile(file: File): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查文件名
  if (file.name !== 'content.txt') {
    errors.push('内容文件必须命名为 content.txt')
  }

  // 检查文件大小
  if (file.size > BATCH_UPLOAD_LIMITS.MAX_CONTENT_SIZE) {
    errors.push(`内容文件大小超过限制（最大${BATCH_UPLOAD_LIMITS.MAX_CONTENT_SIZE / 1024 / 1024}MB）`)
  }

  if (file.size === 0) {
    errors.push('内容文件为空')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证解析后的小说数据
 */
export function validateParsedNovel(novel: ParsedNovel): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 标题
  if (!novel.title || novel.title.length < 2) {
    errors.push('标题长度至少2个字符')
  }
  if (novel.title.length > 200) {
    errors.push('标题长度不能超过200个字符')
  }

  // 简介
  if (!novel.blurb || novel.blurb.length < 10) {
    errors.push('简介长度至少10个字符')
  }
  if (novel.blurb.length > 1000) {
    errors.push('简介长度不能超过1000个字符')
  }

  // Tags
  if (novel.tags.length === 0) {
    warnings.push('建议至少添加1个标签')
  }
  if (novel.tags.length > 20) {
    errors.push('标签数量不能超过20个')
  }

  // 章节
  if (novel.chapters.length < BATCH_UPLOAD_LIMITS.MIN_CHAPTERS) {
    errors.push(`至少需要${BATCH_UPLOAD_LIMITS.MIN_CHAPTERS}个章节`)
  }
  if (novel.chapters.length > BATCH_UPLOAD_LIMITS.MAX_CHAPTERS) {
    errors.push(`章节数量不能超过${BATCH_UPLOAD_LIMITS.MAX_CHAPTERS}个`)
  }

  // 验证每个章节
  novel.chapters.forEach((chapter, index) => {
    if (!chapter.title || chapter.title.trim().length === 0) {
      errors.push(`第${index + 1}章标题不能为空`)
    }
    if (!chapter.content || chapter.content.trim().length < 10) {
      errors.push(`第${index + 1}章内容太短（至少10个字符）`)
    }
    if (chapter.content.length > 50000) {
      warnings.push(`第${index + 1}章内容较长（${chapter.content.length}字符），可能影响加载速度`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 获取图片尺寸
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * 生成小说slug（从标题）
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格转连字符
    .replace(/-+/g, '-') // 多个连字符合并
    .replace(/^-|-$/g, '') // 移除首尾连字符
    .substring(0, 100) // 限制长度
}

/**
 * 计算总字数
 */
export function calculateTotalWordCount(chapters: ParsedNovel['chapters']): number {
  return chapters.reduce((total, chapter) => {
    // 简单的字数统计：中文字符 + 英文单词
    const chineseChars = (chapter.content.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (chapter.content.match(/[a-zA-Z]+/g) || []).length
    return total + chineseChars + englishWords
  }, 0)
}
