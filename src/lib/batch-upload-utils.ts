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
 *       tag4, tag5  (可以多行)
 * Title: 小说标题
 * Genre: Romance
 * Blurb: 小说简介...
 *        可以多行
 *
 * Chapter 1: 章节标题
 * 章节正文内容...
 *
 * Chapter 2: 章节标题
 * 章节正文内容...
 */
export async function parseContentFile(file: File): Promise<ParsedNovel> {
  console.log('📖 [批量上传] 开始解析content.txt:', file.name)

  const text = await file.text()
  const lines = text.split('\n')

  console.log(`📄 [批量上传] 文件总行数: ${lines.length}`)

  // 查找各个字段的起始位置
  let tagsStartIdx = -1
  let titleIdx = -1
  let genreIdx = -1
  let blurbStartIdx = -1
  let firstChapterIdx = -1

  const chapterRegex = /^Chapter\s+\d+[：:]/i

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    if (tagsStartIdx === -1 && trimmed.startsWith('Tags:')) {
      tagsStartIdx = i
    } else if (titleIdx === -1 && trimmed.startsWith('Title:')) {
      titleIdx = i
    } else if (genreIdx === -1 && trimmed.startsWith('Genre:')) {
      genreIdx = i
    } else if (blurbStartIdx === -1 && trimmed.startsWith('Blurb:')) {
      blurbStartIdx = i
    } else if (firstChapterIdx === -1 && chapterRegex.test(trimmed)) {
      firstChapterIdx = i
      break // 找到第一个章节就停止
    }
  }

  console.log('📝 [批量上传] 字段位置:')
  console.log(`  Tags 起始行: ${tagsStartIdx}`)
  console.log(`  Title 行: ${titleIdx}`)
  console.log(`  Genre 行: ${genreIdx}`)
  console.log(`  Blurb 起始行: ${blurbStartIdx}`)
  console.log(`  首章节行: ${firstChapterIdx}`)

  // 验证必需字段存在
  if (tagsStartIdx === -1) {
    console.error('❌ [批量上传] 缺少 Tags 字段')
    throw new Error('文件必须包含 "Tags:" 字段')
  }
  if (titleIdx === -1) {
    console.error('❌ [批量上传] 缺少 Title 字段')
    throw new Error('文件必须包含 "Title:" 字段')
  }
  if (genreIdx === -1) {
    console.error('❌ [批量上传] 缺少 Genre 字段')
    throw new Error('文件必须包含 "Genre:" 字段')
  }
  if (blurbStartIdx === -1) {
    console.error('❌ [批量上传] 缺少 Blurb 字段')
    throw new Error('文件必须包含 "Blurb:" 字段')
  }

  // 验证字段顺序
  if (!(tagsStartIdx < titleIdx && titleIdx < genreIdx && genreIdx < blurbStartIdx)) {
    console.error('❌ [批量上传] 字段顺序错误')
    throw new Error('字段必须按顺序出现：Tags -> Title -> Genre -> Blurb')
  }

  console.log('✅ [批量上传] 字段格式和顺序检查通过')

  // 提取 Tags（可能跨多行，直到 Title 为止）
  let tagsRaw = lines[tagsStartIdx].substring(5).trim()
  for (let i = tagsStartIdx + 1; i < titleIdx; i++) {
    const line = lines[i].trim()
    if (line) {
      tagsRaw += ', ' + line
    }
  }

  const tags = tagsRaw
    .split(',')
    .map(t => normalizeTag(t.trim()))
    .filter(t => t.length > 0)
    .slice(0, 20) // 最多20个tags

  // 提取 Title（单行）
  const title = lines[titleIdx].substring(6).trim()

  // 提取 Genre（单行）
  const genre = lines[genreIdx].substring(6).trim()

  // 提取 Blurb（可能跨多行，直到第一个章节为止）
  let blurb = lines[blurbStartIdx].substring(6).trim()
  const blurbEndIdx = firstChapterIdx !== -1 ? firstChapterIdx : lines.length
  for (let i = blurbStartIdx + 1; i < blurbEndIdx; i++) {
    const line = lines[i].trim()
    if (line && !chapterRegex.test(line)) {
      blurb += '\n' + line
    }
  }
  blurb = blurb.trim()

  console.log('📋 [批量上传] 提取的元数据:')
  console.log(`  标题: ${title}`)
  console.log(`  分类: ${genre}`)
  console.log(`  标签: ${tags.join(', ')}`)
  console.log(`  简介长度: ${blurb.length}字符`)

  if (!title) throw new Error('标题不能为空')
  if (!genre) throw new Error('分类不能为空')
  if (!blurb) throw new Error('简介不能为空')

  // 解析章节（从第一个章节开始）
  const chapters: ParsedNovel['chapters'] = []
  let currentChapter: { number: number; title: string; content: string } | null = null

  const chapterTitleRegex = /^Chapter\s+(\d+)[：:]\s*(.+)$/i

  const startIdx = firstChapterIdx !== -1 ? firstChapterIdx : lines.length

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // 检测章节标题
    const match = trimmedLine.match(chapterTitleRegex)
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
      // 添加到当前章节内容（保留原始格式，包括空行）
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

  console.log(`📚 [批量上传] 解析到 ${chapters.length} 个章节`)

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

  console.log('🔍 [批量上传] 验证封面图片:', file.name)

  // 检查文件类型
  console.log(`📁 [批量上传] 文件类型: ${file.type}`)
  if (!file.type.startsWith('image/')) {
    console.error('❌ [批量上传] 不是图片文件')
    errors.push('封面必须是图片文件')
    return { valid: false, errors, warnings }
  }

  // 检查文件大小
  console.log(`📊 [批量上传] 文件大小: ${(file.size / 1024).toFixed(2)} KB`)
  if (file.size > BATCH_UPLOAD_LIMITS.MAX_COVER_SIZE) {
    console.error('❌ [批量上传] 文件过大')
    errors.push(`封面大小超过限制（最大${BATCH_UPLOAD_LIMITS.MAX_COVER_SIZE / 1024 / 1024}MB）`)
  }

  // 检查图片尺寸
  try {
    const dimensions = await getImageDimensions(file)
    console.log(`📐 [批量上传] 实际尺寸: ${dimensions.width}x${dimensions.height}`)
    console.log(`📐 [批量上传] 要求尺寸: ${BATCH_UPLOAD_LIMITS.COVER_WIDTH}x${BATCH_UPLOAD_LIMITS.COVER_HEIGHT}`)

    if (dimensions.width !== BATCH_UPLOAD_LIMITS.COVER_WIDTH ||
        dimensions.height !== BATCH_UPLOAD_LIMITS.COVER_HEIGHT) {
      console.error('❌ [批量上传] 图片尺寸不符合要求')
      errors.push(
        `封面尺寸必须是${BATCH_UPLOAD_LIMITS.COVER_WIDTH}x${BATCH_UPLOAD_LIMITS.COVER_HEIGHT}，` +
        `当前为${dimensions.width}x${dimensions.height}`
      )
    } else {
      console.log('✅ [批量上传] 图片尺寸检查通过')
    }
  } catch (error) {
    console.error('❌ [批量上传] 无法读取图片尺寸:', error)
    errors.push('无法读取图片尺寸')
  }

  const result = {
    valid: errors.length === 0,
    errors,
    warnings
  }

  console.log(result.valid ? '✅ [批量上传] 封面验证通过' : '❌ [批量上传] 封面验证失败', result)
  return result
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
  console.log('✔️ [批量上传] 验证解析后的数据:', novel.title)

  const errors: string[] = []
  const warnings: string[] = []

  // 标题
  console.log(`📌 [批量上传] 标题长度: ${novel.title?.length || 0}`)
  if (!novel.title || novel.title.length < 2) {
    console.error('❌ [批量上传] 标题太短')
    errors.push('标题长度至少2个字符')
  }
  if (novel.title.length > 200) {
    console.error('❌ [批量上传] 标题太长')
    errors.push('标题长度不能超过200个字符')
  }

  // 简介
  console.log(`📌 [批量上传] 简介长度: ${novel.blurb?.length || 0}`)
  if (!novel.blurb || novel.blurb.length < 10) {
    console.error('❌ [批量上传] 简介太短')
    errors.push('简介长度至少10个字符')
  }
  if (novel.blurb.length > 1000) {
    console.error('❌ [批量上传] 简介太长')
    errors.push('简介长度不能超过1000个字符')
  }

  // Tags
  console.log(`📌 [批量上传] 标签数量: ${novel.tags.length}`)
  if (novel.tags.length === 0) {
    console.warn('⚠️ [批量上传] 没有标签')
    warnings.push('建议至少添加1个标签')
  }
  if (novel.tags.length > 20) {
    errors.push('标签数量不能超过20个')
  }

  // 章节
  console.log(`📌 [批量上传] 章节数量: ${novel.chapters.length}`)
  if (novel.chapters.length < BATCH_UPLOAD_LIMITS.MIN_CHAPTERS) {
    console.error('❌ [批量上传] 章节太少')
    errors.push(`至少需要${BATCH_UPLOAD_LIMITS.MIN_CHAPTERS}个章节`)
  }
  if (novel.chapters.length > BATCH_UPLOAD_LIMITS.MAX_CHAPTERS) {
    console.error('❌ [批量上传] 章节太多')
    errors.push(`章节数量不能超过${BATCH_UPLOAD_LIMITS.MAX_CHAPTERS}个`)
  }

  // 验证每个章节
  novel.chapters.forEach((chapter, index) => {
    if (!chapter.title || chapter.title.trim().length === 0) {
      console.error(`❌ [批量上传] 第${index + 1}章标题为空`)
      errors.push(`第${index + 1}章标题不能为空`)
    }
    if (!chapter.content || chapter.content.trim().length < 10) {
      console.error(`❌ [批量上传] 第${index + 1}章内容太短`)
      errors.push(`第${index + 1}章内容太短（至少10个字符）`)
    }
    if (chapter.content.length > 50000) {
      console.warn(`⚠️ [批量上传] 第${index + 1}章内容较长`)
      warnings.push(`第${index + 1}章内容较长（${chapter.content.length}字符），可能影响加载速度`)
    }
  })

  const result = {
    valid: errors.length === 0,
    errors,
    warnings
  }

  console.log(result.valid ? '✅ [批量上传] 小说数据验证通过' : '❌ [批量上传] 小说数据验证失败', result)
  return result
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
