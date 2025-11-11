// src/lib/view-tracker.ts
// ✅ 修复: 优化性能，减少数据库压力
import { prisma } from './prisma'
import crypto from 'crypto'

interface TrackViewParams {
  novelId: number
  userId?: string | null
  ipAddress: string
  userAgent: string
}

// ✅ 1. 生成游客ID（使用更简单的hash）
function generateGuestId(ipAddress: string, userAgent: string): string {
  const data = `${ipAddress}:${userAgent}`
  return crypto.createHash('md5').update(data).digest('hex')
}

// ✅ 2. 检查是否在24小时内已浏览
async function hasViewedRecently(
  novelId: number,
  userId: string | null | undefined,  // ✅ 修复：允许 null
  guestId: string
): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  try {
    // ✅ 优化: 使用 findFirst 代替 count，更快
    const recentView = await prisma.novelView.findFirst({
      where: {
        novelId,
        ...(userId 
          ? { userId, viewedAt: { gte: twentyFourHoursAgo } }
          : { guestId, viewedAt: { gte: twentyFourHoursAgo } }
        )
      },
      select: { id: true }
    })

    return !!recentView
  } catch (error) {
    console.error('❌ [ViewTracker] Error checking recent view:', error)
    // 出错时返回true，避免重复记录
    return true
  }
}

// ✅ 3. 记录浏览（使用事务确保一致性）
async function recordView(params: TrackViewParams): Promise<boolean> {
  const { novelId, userId, ipAddress, userAgent } = params
  const guestId = userId ? null : generateGuestId(ipAddress, userAgent)

  try {
    // ✅ 使用事务：创建记录 + 更新计数
    await prisma.$transaction(async (tx) => {
      // 创建浏览记录
      await tx.novelView.create({
        data: {
          novelId,
          userId: userId || null,
          guestId,
          ipAddress,
          userAgent,
        }
      })

      // 更新小说浏览量
      await tx.novel.update({
        where: { id: novelId },
        data: { viewCount: { increment: 1 } }
      })
    })

    return true
  } catch (error) {
    console.error('❌ [ViewTracker] Error recording view:', error)
    return false
  }
}

// ✅ 4. 清理旧数据（降低频率到0.1%，减少数据库压力）
async function cleanupOldViews(): Promise<void> {
  // ✅ 只有0.1%的概率执行清理（原来是1%）
  if (Math.random() > 0.001) return

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  try {
    const result = await prisma.novelView.deleteMany({
      where: {
        viewedAt: { lt: thirtyDaysAgo }
      }
    })
    
    console.log(`✅ [ViewTracker] Cleaned up ${result.count} old view records`)
  } catch (error) {
    console.error('❌ [ViewTracker] Error cleaning up old views:', error)
  }
}

// ✅ 5. 主函数
export async function trackView(params: TrackViewParams): Promise<{
  counted: boolean
  viewCount: number
}> {
  const { novelId, userId, ipAddress, userAgent } = params
  const guestId = generateGuestId(ipAddress, userAgent)

  try {
    // ✅ 1. 检查是否最近浏览过
    const hasViewed = await hasViewedRecently(novelId, userId, guestId)
    
    if (hasViewed) {
      // 已浏览过，返回当前计数
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { viewCount: true }
      })
      
      return {
        counted: false,
        viewCount: novel?.viewCount || 0
      }
    }

    // ✅ 2. 记录新浏览
    const recorded = await recordView(params)
    
    if (!recorded) {
      throw new Error('Failed to record view')
    }

    // ✅ 3. 获取更新后的浏览量
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { viewCount: true }
    })

    // ✅ 4. 异步清理旧数据（不阻塞响应）
    cleanupOldViews().catch(err => {
      console.error('❌ [ViewTracker] Cleanup error:', err)
    })

    return {
      counted: true,
      viewCount: novel?.viewCount || 0
    }
  } catch (error) {
    console.error('❌ [ViewTracker] Error tracking view:', error)
    
    // ✅ 出错时返回默认值，不影响用户体验
    return {
      counted: false,
      viewCount: 0
    }
  }
}