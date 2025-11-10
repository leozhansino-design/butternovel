// src/lib/view-tracker.ts
import { prisma } from './prisma'
import { headers } from 'next/headers'

function generateGuestId(ip: string, userAgent: string): string {
  const crypto = require('crypto')
  return crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .slice(0, 32)
}

async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  )
}

async function getUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get('user-agent') || 'unknown'
}

export async function trackNovelView(
  novelId: number,
  userId?: string | null
): Promise<{ counted: boolean; viewCount: number }> {
  try {
    const ip = await getClientIp()
    const userAgent = await getUserAgent()
    const guestId = generateGuestId(ip, userAgent)
    
    const now = new Date()
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const existingView = await prisma.novelView.findFirst({
      where: {
        novelId,
        ...(userId ? { userId } : { guestId }),
        viewedAt: { gte: cutoffTime }
      }
    })

    if (existingView) {
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { viewCount: true }
      })
      return { counted: false, viewCount: novel?.viewCount || 0 }
    }

    await prisma.novelView.create({
      data: {
        novelId,
        userId,
        guestId: userId ? null : guestId,
        ipAddress: ip,
        userAgent,
        viewedAt: now
      }
    })

    const novel = await prisma.novel.update({
      where: { id: novelId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true }
    })

    if (Math.random() < 0.01) {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      await prisma.novelView.deleteMany({
        where: { viewedAt: { lt: thirtyDaysAgo } }
      })
    }

    return { counted: true, viewCount: novel.viewCount }
  } catch (error) {
    console.error('❌ View tracking error:', error)
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { viewCount: true }
    })
    return { counted: false, viewCount: novel?.viewCount || 0 }
  }
}