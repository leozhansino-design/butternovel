// src/hooks/useReadingTimeTracker.ts
'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

/**
 * 阅读时长追踪Hook
 *
 * 用法:
 * ```tsx
 * useReadingTimeTracker(chapterId)
 * ```
 *
 * 功能:
 * - 追踪用户在章节阅读器页面停留的时间
 * - 每分钟发送一次心跳到服务器
 * - 用户离开页面时自动保存
 */
export function useReadingTimeTracker(chapterId: number | null) {
  const { data: session } = useSession()
  const sessionStartTime = useRef<Date | null>(null)
  const minutesAccumulated = useRef(0)
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 只有登录用户才追踪
    if (!session?.user || !chapterId) {
      return
    }

    // 开始追踪
    sessionStartTime.current = new Date()
    console.log('📖 Reading session started')

    // 每分钟发送心跳
    heartbeatInterval.current = setInterval(() => {
      if (sessionStartTime.current) {
        const now = new Date()
        const minutesElapsed = Math.floor(
          (now.getTime() - sessionStartTime.current.getTime()) / 60000
        )

        if (minutesElapsed > minutesAccumulated.current) {
          const newMinutes = minutesElapsed - minutesAccumulated.current
          minutesAccumulated.current = minutesElapsed

          // 发送心跳到服务器
          sendReadingHeartbeat(chapterId, newMinutes)
        }
      }
    }, 60000) // 每分钟检查一次

    // 清理函数：用户离开页面时
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }

      // 保存最后的阅读时间
      if (sessionStartTime.current) {
        const now = new Date()
        const totalMinutes = Math.floor(
          (now.getTime() - sessionStartTime.current.getTime()) / 60000
        )

        if (totalMinutes > 0) {
          sendReadingHeartbeat(chapterId, totalMinutes)
        }
      }

      console.log('📖 Reading session ended')
    }
  }, [session, chapterId])
}

/**
 * 发送阅读心跳到服务器
 */
async function sendReadingHeartbeat(chapterId: number, minutes: number) {
  try {
    await fetch('/api/reading/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId,
        minutes,
      }),
    })

    console.log(`📖 Reading heartbeat sent: ${minutes} minute(s)`)
  } catch (error) {
    console.error('Failed to send reading heartbeat:', error)
  }
}
