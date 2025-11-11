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

// 添加连接池参数
databaseUrl.searchParams.set('connection_limit', '5')        // 每个实例最多5个连接
databaseUrl.searchParams.set('pool_timeout', '10')           // 连接池超时10秒
databaseUrl.searchParams.set('connect_timeout', '10')        // 连接超时10秒
databaseUrl.searchParams.set('socket_timeout', '30')         // 查询超时30秒

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
  log: process.env.NODE_ENV === 'development' 
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