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
// 移除可能的前后引号
const rawDatabaseUrl = (process.env.DATABASE_URL || '').replace(/^["']|["']$/g, '')
const databaseUrl = new URL(rawDatabaseUrl)

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

// 🚨 添加查询计数监控 - 检测异常查询
let queryCount = 0
let resetTimer: NodeJS.Timeout | null = null

const basePrisma = new PrismaClient({
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

// 使用 $extends 替代 $use（Prisma 5.x+）
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        queryCount++

        // 每秒重置计数器
        if (!resetTimer) {
          resetTimer = setTimeout(() => {
            if (queryCount > 100) {
              console.error(`⚠️ WARNING: ${queryCount} database queries in 1 second!`)
            }
            queryCount = 0
            resetTimer = null
          }, 1000)
        }

        // 如果查询数超过阈值，立即警告
        if (queryCount > 100 && queryCount % 50 === 0) {
          console.error(`🚨 CRITICAL: ${queryCount} queries detected! Possible query loop.`)
          console.error(`Query: ${model}.${operation}`)
        }

        return query(args)
      },
    },
  },
})

// ✅ 4. 开发环境保持单例
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  globalForPrisma.prisma = prisma
}

// ✅ 5. 优雅关闭（生产环境）
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}