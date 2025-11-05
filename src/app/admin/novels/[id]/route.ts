// src/app/api/admin/novels/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { uploadNovelCover, deleteImage } from '@/lib/cloudinary'

// PUT /api/admin/novels/[id] - 更新小说（增量更新）
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📝 [API] Received update request for novel:', params.id)

    // 验证管理员权限
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const novelId = parseInt(params.id)
    const updates = await request.json()

    console.log('📦 [API] Updates to apply:', Object.keys(updates))

    // 获取当前小说数据
    const currentNovel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { 
        id: true, 
        title: true,
        coverImage: true, 
        coverImagePublicId: true 
      }
    })

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

    const updatedNovel = await prisma.novel.update({
      where: { id: novelId },
      data,
      include: {
        category: true,
        chapters: true,
      }
    })

    console.log('✅ [API] Novel updated successfully!')

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
}

// DELETE /api/admin/novels/[id] - 删除小说
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ [API] Received delete request for novel:', params.id)

    // 验证管理员权限
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const novelId = parseInt(params.id)

    // 获取小说信息
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { 
        id: true, 
        title: true, 
        coverImagePublicId: true 
      }
    })

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
    await prisma.novel.delete({
      where: { id: novelId }
    })

    console.log(`✅ [API] Novel deleted: ${novel.title}`)

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
}