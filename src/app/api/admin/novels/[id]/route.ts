// src/app/api/admin/novels/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'
import { uploadNovelCover, deleteImage } from '@/lib/cloudinary'
import { validateWithSchema, novelUpdateSchema } from '@/lib/validators'
import { invalidateNovelRelatedCaches, invalidateNovelCache, invalidateCategoryCache } from '@/lib/cache'

// PUT /api/admin/novels/[id] - 更新小说（增量更新）
export const PUT = withAdminAuth(async (
  session,
  request: Request,
  props: { params: Promise<{ id: string }> }  // ⭐ Next.js 15
) => {
  try {
    const params = await props.params  // ⭐ await params
    console.log('📝 [API] Received update request for novel:', params.id)

    const novelId = parseInt(params.id)
    const body = await request.json()

    // ✅ 使用 Zod 验证（验证基本字段，newCoverImage 在 schema 外处理）
    const { newCoverImage, ...updateFields } = body
    const validation = validateWithSchema(novelUpdateSchema, updateFields)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const updates = { ...validation.data, newCoverImage }
    console.log('📦 [API] Updates to apply:', Object.keys(updates))

    // 获取当前小说数据
    // 🔄 添加数据库重试机制，解决连接超时问题
    const currentNovel = await withRetry(
      () => prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          coverImagePublicId: true,
          categoryId: true
        }
      }),
      { operationName: 'Get current novel for update' }
    )

    if (!currentNovel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // 准备更新数据
    const data: any = {}

    // 1. 更新标题（如果改变了，重新生成 slug）
    if (updates.title && updates.title !== currentNovel.title) {
      data.title = updates.title
      data.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now()
      console.log('📝 [API] Updating title and slug')
    }

    // 2. 更新简介
    if (updates.blurb !== undefined) {
      data.blurb = updates.blurb
      console.log('📝 [API] Updating blurb')
    }

    // 3. 更新分类
    if (updates.categoryId !== undefined) {
      data.categoryId = updates.categoryId
      console.log('📝 [API] Updating category')
    }

    // 4. 更新状态
    if (updates.status !== undefined) {
      data.status = updates.status
      console.log('📝 [API] Updating status')
    }

    // 5. 更新发布状态
    if (updates.isPublished !== undefined) {
      data.isPublished = updates.isPublished
      data.isDraft = !updates.isPublished
      console.log('📝 [API] Updating publish status')
    }

    // 6. 更新封面（如果有新图片）
    if (updates.newCoverImage) {
      console.log('📤 [API] Uploading new cover to Cloudinary...')

      try {
        // 上传新封面
        const coverResult = await uploadNovelCover(
          updates.newCoverImage,
          updates.title || currentNovel.title
        )

        data.coverImage = coverResult.url
        data.coverImagePublicId = coverResult.publicId

        console.log('✅ [API] New cover uploaded:', coverResult.url)

        // 删除旧封面（如果有 publicId）
        if (currentNovel.coverImagePublicId) {
          console.log('🗑️ [API] Deleting old cover:', currentNovel.coverImagePublicId)
          await deleteImage(currentNovel.coverImagePublicId)
        }

      } catch (uploadError: any) {
        console.error('❌ [API] Failed to upload new cover:', uploadError)
        return NextResponse.json(
          { error: `Failed to upload cover: ${uploadError.message}` },
          { status: 500 }
        )
      }
    }

    // 执行更新
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No changes to update' },
        { status: 400 }
      )
    }

    console.log('💾 [API] Updating novel in database...')

    // 🔄 添加数据库重试机制，解决连接超时问题
    const updatedNovel = await withRetry(
      () => prisma.novel.update({
        where: { id: novelId },
        data,
        include: {
          category: true,
          chapters: true,
        }
      }),
      { operationName: 'Update novel in database' }
    )

    console.log('✅ [API] Novel updated successfully!')

    // ⚡ Invalidate caches for old slug/category
    await invalidateNovelCache(currentNovel.slug)
    await invalidateCategoryCache(currentNovel.categoryId)

    // ⚡ Invalidate caches for new slug/category (if changed)
    if (updatedNovel.slug !== currentNovel.slug) {
      await invalidateNovelCache(updatedNovel.slug)
    }
    if (updatedNovel.categoryId !== currentNovel.categoryId) {
      await invalidateCategoryCache(updatedNovel.categoryId)
    }

    // ⚡ Invalidate home page cache
    await invalidateNovelRelatedCaches(updatedNovel.slug, updatedNovel.categoryId)
    console.log('🔄 [API] Cache invalidated for updated novel')

    return NextResponse.json({
      success: true,
      novel: updatedNovel,
      message: 'Novel updated successfully'
    })

  } catch (error: any) {
    console.error('❌ [API] Update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update novel' },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/novels/[id] - 删除小说
export const DELETE = withAdminAuth(async (
  session,
  request: Request,
  props: { params: Promise<{ id: string }> }  // ⭐ Next.js 15
) => {
  try {
    const params = await props.params  // ⭐ await params
    console.log('🗑️ [API] Received delete request for novel:', params.id)

    const novelId = parseInt(params.id)

    // 获取小说信息
    // 🔄 添加数据库重试机制，解决连接超时问题
    const novel = await withRetry(
      () => prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImagePublicId: true,
          categoryId: true
        }
      }),
      { operationName: 'Get novel for deletion' }
    )

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    console.log(`🗑️ [API] Deleting novel: ${novel.title}`)

    // 1. 删除 Cloudinary 封面（如果有）
    if (novel.coverImagePublicId) {
      console.log('🗑️ [API] Deleting cover from Cloudinary:', novel.coverImagePublicId)
      await deleteImage(novel.coverImagePublicId)
    }

    // 2. 删除数据库记录（章节会级联删除）
    // 🔄 添加数据库重试机制，解决连接超时问题
    await withRetry(
      () => prisma.novel.delete({
        where: { id: novelId }
      }),
      { operationName: 'Delete novel from database' }
    )

    console.log(`✅ [API] Novel deleted: ${novel.title}`)

    // ⚡ Invalidate all related caches
    await invalidateNovelRelatedCaches(novel.slug, novel.categoryId)
    console.log('🔄 [API] Cache invalidated for deleted novel')

    return NextResponse.json({
      success: true,
      message: 'Novel deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ [API] Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete novel' },
      { status: 500 }
    )
  }
})