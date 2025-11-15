// src/app/api/paragraph-comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteImage } from '@/lib/cloudinary'

// DELETE - 删除段落评论
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const commentId = id

    // 查找评论
    const comment = await prisma.paragraphComment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    // 验证是否是评论作者或管理员
    // 如果不是评论作者，检查是否是管理员
    if (comment.userId !== session.user.id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })

      if (!currentUser || currentUser.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // 如果有图片，从Cloudinary删除
    if (comment.imagePublicId) {
      await deleteImage(comment.imagePublicId)
    }

    // 删除评论（级联删除点赞）
    await prisma.paragraphComment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete paragraph comment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
