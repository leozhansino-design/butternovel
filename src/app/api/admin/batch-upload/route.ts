// app/api/admin/batch-upload/route.ts
// 批量上传小说API

import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { v2 as cloudinary } from 'cloudinary'
import { Prisma } from '@prisma/client'
import {
  generateSlugFromTitle,
  calculateTotalWordCount,
  type ParsedNovel
} from '@/lib/batch-upload-utils'

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/admin/batch-upload
 * 上传单本小说（批量上传时前端会依次调用此API）
 *
 * FormData:
 * - coverImage: File
 * - title: string
 * - genre: string (category slug)
 * - blurb: string
 * - tags: string (JSON array)
 * - chapters: string (JSON array of {number, title, content})
 */
export const POST = withAdminAuth(async (session, request: Request) => {
  try {
    // 解析FormData
    const formData = await request.formData()
    const coverImage = formData.get('coverImage') as File
    const title = formData.get('title') as string
    const genre = formData.get('genre') as string
    const blurb = formData.get('blurb') as string
    const tagsJson = formData.get('tags') as string
    const chaptersJson = formData.get('chapters') as string

    if (!coverImage || !title || !genre || !blurb || !tagsJson || !chaptersJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tags: string[] = JSON.parse(tagsJson)
    const chapters: ParsedNovel['chapters'] = JSON.parse(chaptersJson)

    // 3. 检查书名是否重复
    const existingNovel = await withRetry(() =>
      prisma.novel.findFirst({
        where: {
          title: {
            equals: title,
            mode: 'insensitive'
          }
        },
        select: { id: true, title: true }
      })
    ) as { id: number; title: string } | null

    if (existingNovel) {
      return NextResponse.json(
        { error: `小说《${title}》已存在（ID: ${existingNovel.id}）` },
        { status: 409 }
      )
    }

    // 4. 查找分类
    const category = await withRetry(() =>
      prisma.category.findFirst({
        where: {
          OR: [
            { slug: genre.toLowerCase() },
            { name: { equals: genre, mode: 'insensitive' } }
          ]
        }
      })
    ) as { id: number; name: string; slug: string } | null

    if (!category) {
      return NextResponse.json(
        { error: `分类 "${genre}" 不存在` },
        { status: 400 }
      )
    }

    // 5. 上传封面到Cloudinary
    const coverImageUrl = await uploadCoverToCloudinary(coverImage, title)

    // 6. 生成slug（确保唯一）
    let slug = generateSlugFromTitle(title)
    let slugSuffix = 0
    while (true) {
      const existingSlug = await withRetry(() =>
        prisma.novel.findUnique({
          where: { slug: slug },
          select: { id: true }
        })
      )
      if (!existingSlug) break
      slugSuffix++
      slug = `${generateSlugFromTitle(title)}-${slugSuffix}`
    }

    // 7. 计算统计数据
    const totalChapters = chapters.length
    const wordCount = calculateTotalWordCount(chapters)

    // 8. 创建小说和章节（使用事务）
    const novel = await withRetry(() =>
      prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 创建小说
        const createdNovel = await tx.novel.create({
          data: {
            title,
            slug,
            blurb,
            coverImage: coverImageUrl,
            categoryId: category.id,
            authorId: session.id,
            authorName: session.name || 'Admin',
            status: 'COMPLETED', // 批量上传的小说默认已完结
            isPublished: true,
            totalChapters,
            wordCount,
          }
        })

        // 创建所有章节（需要添加slug字段）
        await tx.chapter.createMany({
          data: chapters.map(chapter => ({
            title: chapter.title,
            slug: `${slug}-chapter-${chapter.number}`,
            content: chapter.content,
            chapterNumber: chapter.number,
            novelId: createdNovel.id,
            isPublished: true,
            wordCount: countWords(chapter.content),
          }))
        })

        // 创建tags关联
        if (tags.length > 0) {
          // 获取或创建tags
          const tagRecords = await Promise.all(
            tags.map(async (tagName) => {
              return tx.tag.upsert({
                where: { name: tagName },
                create: {
                  name: tagName,
                  slug: tagName,
                  count: 1
                },
                update: {
                  count: { increment: 1 }
                }
              })
            })
          )

          // 关联tags到小说
          await tx.novel.update({
            where: { id: createdNovel.id },
            data: {
              tags: {
                connect: tagRecords.map(tag => ({ id: tag.id }))
              }
            }
          })
        }

        return createdNovel
      })
    ) as { id: number; title: string; slug: string; [key: string]: any }

    return NextResponse.json({
      success: true,
      novel: {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        totalChapters,
        wordCount,
      }
    })

  } catch (error: any) {
    console.error('[Batch Upload] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
})

/**
 * 上传封面到Cloudinary
 */
async function uploadCoverToCloudinary(file: File, novelTitle: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  const dataURI = `data:${file.type};base64,${base64}`

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataURI,
      {
        folder: 'novel-covers',
        public_id: `batch-${Date.now()}-${novelTitle.substring(0, 30)}`,
        transformation: [
          { width: 300, height: 400, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
        } else if (result) {
          resolve(result.secure_url)
        } else {
          reject(new Error('Cloudinary upload failed: No result'))
        }
      }
    )
  })
}

/**
 * 简单的字数统计
 */
function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
}
