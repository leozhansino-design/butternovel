// src/lib/prisma.ts
// ✅ 修复: 添加连接池限制 + 超时设置 + 环境变量验证
import './validate-env'  // ⭐ 重要：导入环境变量验证
import { PrismaClient } from '@prisma/client'

// ✅ 1. 验证必需的环境变量
const requiredEnvVars = ['DATABASE_URL']
const missingVars = requiredEnvVars.filter(key => !process.env[key])

if (missingVars.length > 0) {
  throw new Error(`❌ Missing environment variables: ${missingVars.join(', ')}`)
}

// ✅ 2. 配置数据库连接字符串（添加连接池限制和超时）
const databaseUrl = new URL(process.env.DATABASE_URL!)

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

// 🔧 查询计数器 - 用于调试
let queryCount = 0
let lastResetTime = Date.now()

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

// 🔧 添加中间件监控查询数量
if (!isBuildTime) {
  prisma.$use(async (params, next) => {
    queryCount++

    // 每分钟重置一次计数
    const now = Date.now()
    if (now - lastResetTime > 60000) {
      if (queryCount > 100) {
        console.warn(`⚠️  [Prisma] High query count in last minute: ${queryCount}`)
      }
      queryCount = 0
      lastResetTime = now
    }

    // 如果1分钟内超过1000次查询，记录警告
    if (queryCount > 1000) {
      console.error(`🚨 [Prisma] CRITICAL: ${queryCount} queries in 1 minute!`)
      console.error(`🚨 [Prisma] Query: ${params.model}.${params.action}`)
    }

    return next(params)
  })
}

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