// src/lib/prisma.ts
// ✅ 修复: 添加连接池限制 + 超时设置 + 环境变量验证
import './validate-env'  // ⭐ 重要：导入环境变量验证
import { PrismaClient } from '@prisma/client'

// ✅ 1. 检查是否有 DATABASE_URL
const databaseUrlEnv = process.env.DATABASE_URL

if (!databaseUrlEnv || databaseUrlEnv.trim() === '') {
  throw new Error(`❌ Missing DATABASE_URL environment variable`)
}

// ✅ 2. 配置数据库连接字符串（添加连接池限制和超时）
// 🔧 去除可能的引号包裹（某些环境变量设置可能错误地添加了引号）
const rawDatabaseUrl = databaseUrlEnv.replace(/^["']|["']$/g, '')

// 🔧 验证 URL 格式，如果无效则抛出友好错误
let databaseUrl: URL
try {
  databaseUrl = new URL(rawDatabaseUrl)
} catch (error) {
  console.error('❌ Invalid DATABASE_URL format:', rawDatabaseUrl.substring(0, 50) + '...')
  throw new Error('DATABASE_URL must be a valid URL')
}

// 🔧 根据环境调整连接池参数
// Build 时使用更保守的设置，避免连接池耗尽
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

// 添加连接池参数 - ⚡ 优化：增加连接池大小和超时时间
databaseUrl.searchParams.set('connection_limit', isBuildTime ? '2' : '15')       // 运行时增加到15个连接
databaseUrl.searchParams.set('pool_timeout', isBuildTime ? '30' : '20')          // 连接池超时增加到20秒
databaseUrl.searchParams.set('connect_timeout', '15')                            // 连接超时15秒
databaseUrl.searchParams.set('socket_timeout', '45')                             // 查询超时增加到45秒

// ✅ 3. 创建Prisma单例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl.toString(),
    },
  },
  // 🔧 Build 时只记录错误，减少开销
  log: isBuildTime
    ? ['error']
    : process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
})

// ✅ 4. 开发环境保持单例
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ✅ 5. 优雅关闭（生产环境）
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}