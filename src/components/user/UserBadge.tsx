// src/components/user/UserBadge.tsx
'use client'

import { getUserLevel, calculateContributionPoints } from '@/lib/user-level'
import type { UserLevel } from '@/lib/user-level'

interface UserBadgeProps {
  user: {
    name: string | null
    avatar: string | null
    contributionPoints?: number
    stats?: {
      comments: number
      ratings: number
      replies: number
      likes: number
    }
  }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLevel?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: {
    container: 'w-12 h-12',
    avatar: 'w-10 h-10',
    border: 'p-[2px]',
    text: 'text-[10px]',
  },
  md: {
    container: 'w-16 h-16',
    avatar: 'w-14 h-14',
    border: 'p-[3px]',
    text: 'text-xs',
  },
  lg: {
    container: 'w-24 h-24',
    avatar: 'w-20 h-20',
    border: 'p-1',
    text: 'text-sm',
  },
  xl: {
    container: 'w-32 h-32',
    avatar: 'w-28 h-28',
    border: 'p-1.5',
    text: 'text-base',
  },
}

export default function UserBadge({
  user,
  size = 'md',
  showLevel = true,
  className = '',
}: UserBadgeProps) {
  // 计算用户等级
  let level: UserLevel
  if (user.contributionPoints !== undefined) {
    level = getUserLevel(user.contributionPoints)
  } else if (user.stats) {
    const points = calculateContributionPoints(user.stats)
    level = getUserLevel(points)
  } else {
    level = getUserLevel(0)
  }

  const sizeClasses = SIZE_CLASSES[size]
  const userName = user.name || 'Anonymous'
  const userInitial = userName.charAt(0).toUpperCase()

  // 根据等级样式生成边框类
  const getBorderClass = () => {
    switch (level.badgeStyle) {
      case 'simple':
        return `bg-gradient-to-br ${level.borderGradient}`
      case 'medium':
        return `bg-gradient-to-br ${level.borderGradient} shadow-md`
      case 'fancy':
        return `bg-gradient-to-br ${level.borderGradient} shadow-lg animate-pulse-slow`
      case 'legendary':
        return `bg-gradient-to-br ${level.borderGradient} shadow-2xl animate-pulse-slow`
      default:
        return `bg-gradient-to-br ${level.borderGradient}`
    }
  }

  // 光晕效果
  const getGlowStyle = () => {
    if (level.badgeStyle === 'fancy' || level.badgeStyle === 'legendary') {
      return {
        boxShadow: `0 0 20px ${level.glowColor}, 0 0 40px ${level.glowColor}`,
      }
    }
    if (level.badgeStyle === 'medium') {
      return {
        boxShadow: `0 0 10px ${level.glowColor}`,
      }
    }
    return {}
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Avatar with Badge Border */}
      <div
        className={`${sizeClasses.container} ${sizeClasses.border} ${getBorderClass()} rounded-full relative`}
        style={getGlowStyle()}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={userName}
            className={`${sizeClasses.avatar} rounded-full object-cover`}
          />
        ) : (
          <div
            className={`${sizeClasses.avatar} rounded-full flex items-center justify-center text-white font-bold`}
            style={{ backgroundColor: level.borderColor }}
          >
            {userInitial}
          </div>
        )}

        {/* Level Badge (Optional small indicator on avatar) */}
        {level.level > 1 && (
          <div
            className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 text-xs font-bold shadow-md"
            style={{ color: level.borderColor }}
          >
            Lv{level.level}
          </div>
        )}
      </div>

      {/* Level Name */}
      {showLevel && (
        <div
          className={`mt-2 font-semibold ${sizeClasses.text}`}
          style={{ color: level.borderColor }}
        >
          {level.name}
        </div>
      )}
    </div>
  )
}

// Pulse animation for fancy badges
// Add to global CSS:
// @keyframes pulse-slow {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.8; }
// }
