// src/lib/user-level.ts
/**
 * 用户等级勋章系统
 *
 * 贡献度计算规则：
 * - 发表评论: +3分
 * - 发表评分: +5分
 * - 回复评论: +2分
 * - 发出点赞: +1分
 */

export interface UserLevel {
  level: number
  name: string
  minPoints: number
  maxPoints: number
  borderColor: string
  borderGradient: string
  glowColor: string
  badgeStyle: 'simple' | 'medium' | 'fancy' | 'legendary'
  description: string
}

export const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    name: '新手读者',
    minPoints: 0,
    maxPoints: 50,
    borderColor: '#9CA3AF', // gray-400
    borderGradient: 'from-gray-300 to-gray-400',
    glowColor: 'rgba(156, 163, 175, 0.3)',
    badgeStyle: 'simple',
    description: '刚刚开始阅读之旅',
  },
  {
    level: 2,
    name: '活跃读者',
    minPoints: 51,
    maxPoints: 150,
    borderColor: '#10B981', // green-500
    borderGradient: 'from-green-300 to-green-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    badgeStyle: 'simple',
    description: '经常参与讨论',
  },
  {
    level: 3,
    name: '资深读者',
    minPoints: 151,
    maxPoints: 300,
    borderColor: '#3B82F6', // blue-500
    borderGradient: 'from-blue-300 to-blue-500',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    badgeStyle: 'medium',
    description: '拥有独到见解',
  },
  {
    level: 4,
    name: '书评达人',
    minPoints: 301,
    maxPoints: 600,
    borderColor: '#8B5CF6', // violet-500
    borderGradient: 'from-violet-300 to-violet-500',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    badgeStyle: 'medium',
    description: '深度书评专家',
  },
  {
    level: 5,
    name: '文学鉴赏家',
    minPoints: 601,
    maxPoints: 1000,
    borderColor: '#EC4899', // pink-500
    borderGradient: 'from-pink-300 via-pink-400 to-pink-500',
    glowColor: 'rgba(236, 72, 153, 0.7)',
    badgeStyle: 'fancy',
    description: '品味非凡的鉴赏家',
  },
  {
    level: 6,
    name: '传奇评论家',
    minPoints: 1001,
    maxPoints: 2000,
    borderColor: '#F59E0B', // amber-500
    borderGradient: 'from-yellow-300 via-amber-400 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    badgeStyle: 'fancy',
    description: '影响力巨大的评论家',
  },
  {
    level: 7,
    name: '殿堂级书友',
    minPoints: 2001,
    maxPoints: 5000,
    borderColor: '#EF4444', // red-500
    borderGradient: 'from-red-400 via-orange-500 to-yellow-400',
    glowColor: 'rgba(239, 68, 68, 0.9)',
    badgeStyle: 'legendary',
    description: '书评界的殿堂级人物',
  },
  {
    level: 8,
    name: '终极书虫',
    minPoints: 5001,
    maxPoints: 999999,
    borderColor: '#A855F7', // purple-500
    borderGradient: 'from-purple-400 via-pink-500 to-red-500',
    glowColor: 'rgba(168, 85, 247, 1)',
    badgeStyle: 'legendary',
    description: '传说中的终极书虫',
  },
]

/**
 * 贡献度分数权重
 */
export const CONTRIBUTION_WEIGHTS = {
  COMMENT: 3,
  RATING: 5,
  REPLY: 2,
  LIKE: 1,
}

/**
 * 根据贡献度分数获取用户等级
 */
export function getUserLevel(contributionPoints: number): UserLevel {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    const level = USER_LEVELS[i]
    if (contributionPoints >= level.minPoints) {
      return level
    }
  }
  return USER_LEVELS[0] // 默认返回第一级
}

/**
 * 计算用户的贡献度分数
 */
export function calculateContributionPoints(stats: {
  comments: number
  ratings: number
  replies: number
  likes: number
}): number {
  return (
    stats.comments * CONTRIBUTION_WEIGHTS.COMMENT +
    stats.ratings * CONTRIBUTION_WEIGHTS.RATING +
    stats.replies * CONTRIBUTION_WEIGHTS.REPLY +
    stats.likes * CONTRIBUTION_WEIGHTS.LIKE
  )
}

/**
 * 获取下一等级所需分数
 */
export function getPointsToNextLevel(currentPoints: number): {
  current: UserLevel
  next: UserLevel | null
  pointsNeeded: number
  progress: number // 0-100
} {
  const currentLevel = getUserLevel(currentPoints)
  const nextLevelIndex = USER_LEVELS.findIndex(l => l.level === currentLevel.level) + 1
  const nextLevel = nextLevelIndex < USER_LEVELS.length ? USER_LEVELS[nextLevelIndex] : null

  if (!nextLevel) {
    return {
      current: currentLevel,
      next: null,
      pointsNeeded: 0,
      progress: 100,
    }
  }

  const pointsInCurrentLevel = currentPoints - currentLevel.minPoints
  const pointsNeededForLevel = nextLevel.minPoints - currentLevel.minPoints
  const progress = Math.min(100, (pointsInCurrentLevel / pointsNeededForLevel) * 100)

  return {
    current: currentLevel,
    next: nextLevel,
    pointsNeeded: nextLevel.minPoints - currentPoints,
    progress,
  }
}

/**
 * 格式化阅读时长
 * @param minutes 总分钟数
 */
export function formatReadingTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}分钟`
  }

  if (mins === 0) {
    return `${hours}小时`
  }

  return `${hours}小时${mins}分钟`
}
