// src/lib/prisma.ts
// Database connection with connection pooling and monitoring
import './validate-env'
import { PrismaClient } from '@prisma/client'

// 1. Validate required environment variables
const requiredEnvVars = ['DATABASE_URL']
const missingVars = requiredEnvVars.filter(key => !process.env[key])

if (missingVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`)
}

// 2. Configure database connection string with connection pooling
// Remove potential quotes from environment variable
const rawDatabaseUrl = (process.env.DATABASE_URL || '').replace(/^["']|["']$/g, '')
const databaseUrl = new URL(rawDatabaseUrl)

// Adjust connection pool parameters based on environment
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

// Add connection pool parameters
databaseUrl.searchParams.set('connection_limit', isBuildTime ? '2' : '15')
databaseUrl.searchParams.set('pool_timeout', isBuildTime ? '30' : '20')
databaseUrl.searchParams.set('connect_timeout', '15')
databaseUrl.searchParams.set('socket_timeout', '45')

// 3. Create Prisma singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Query counter for monitoring excessive database queries
let queryCount = 0
let resetTimer: NodeJS.Timeout | null = null

const basePrisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl.toString(),
    },
  },
  log: isBuildTime
    ? ['error']
    : process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
})

// Use $extends instead of deprecated $use (Prisma 5.x+)
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        queryCount++

        // Reset counter every second
        if (!resetTimer) {
          resetTimer = setTimeout(() => {
            if (queryCount > 100) {
              console.error(`[Database] WARNING: ${queryCount} queries in 1 second!`)
            }
            queryCount = 0
            resetTimer = null
          }, 1000)
        }

        // Alert if query threshold exceeded
        if (queryCount > 100 && queryCount % 50 === 0) {
          console.error(`[Database] CRITICAL: ${queryCount} queries detected! Possible query loop.`)
          console.error(`[Database] Query: ${model}.${operation}`)
        }

        return query(args)
      },
    },
  },
})

// 4. Keep singleton in development
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  globalForPrisma.prisma = prisma
}

// 5. Graceful shutdown in production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
