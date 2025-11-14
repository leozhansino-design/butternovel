// src/lib/contribution.ts
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { CONTRIBUTION_WEIGHTS } from '@/lib/user-level'

/**
 * 更新用户贡献度分数
 * 每次用户进行活动时调用此函数
 */
export async function updateUserContribution(
  userId: string,
  action: 'comment' | 'rating' | 'reply' | 'like'
): Promise<void> {
  const points = CONTRIBUTION_WEIGHTS[action.toUpperCase() as keyof typeof CONTRIBUTION_WEIGHTS]

  if (!points) {
    console.warn(`Unknown contribution action: ${action}`)
    return
  }

  try {
    await withRetry(
      () =>
        prisma.user.update({
          where: { id: userId },
          data: {
            contributionPoints: {
              increment: points,
            },
          },
        }),
      { operationName: `Update contribution for ${action}` }
    )

    console.log(`✓ User ${userId} gained +${points} points for ${action}`)
  } catch (error) {
    console.error(`Failed to update contribution for ${userId}:`, error)
    // 不抛出错误，避免影响主要功能
  }
}

/**
 * 批量重新计算用户贡献度分数
 * 用于数据修复或初始化
 */
export async function recalculateUserContribution(userId: string): Promise<number> {
  try {
    // 获取用户的所有活动统计
    const stats = await withRetry(
      () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            _count: {
              select: {
                comments: true,
                ratings: true,
                ratingReplies: true,
                likes: true,
              },
            },
          },
        }),
      { operationName: 'Get user stats for recalculation' }
    )

    if (!stats) {
      throw new Error('User not found')
    }

    // 计算总分
    const totalPoints =
      stats._count.comments * CONTRIBUTION_WEIGHTS.COMMENT +
      stats._count.ratings * CONTRIBUTION_WEIGHTS.RATING +
      stats._count.ratingReplies * CONTRIBUTION_WEIGHTS.REPLY +
      stats._count.likes * CONTRIBUTION_WEIGHTS.LIKE

    // 更新到数据库
    await withRetry(
      () =>
        prisma.user.update({
          where: { id: userId },
          data: {
            contributionPoints: totalPoints,
          },
        }),
      { operationName: 'Update recalculated contribution' }
    )

    console.log(`✓ User ${userId} contribution recalculated: ${totalPoints} points`)
    return totalPoints
  } catch (error) {
    console.error(`Failed to recalculate contribution for ${userId}:`, error)
    throw error
  }
}
