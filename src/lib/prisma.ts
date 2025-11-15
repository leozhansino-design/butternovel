// src/lib/prisma.ts
// 🔧 FIX: Database connection with proper singleton pattern to prevent connection pool exhaustion
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

// 🔧 FIX: Optimized connection pool settings to prevent "Max client connections reached"
// - connection_limit: Reduced from 15 to 10 (prevents exhausting Neon's free tier limit of 20)
// - pool_timeout: Increased from 20 to 60 (wait longer for available connection)
// - connect_timeout: Reduced from 15 to 10 (fail faster on connection issues)
databaseUrl.searchParams.set('connection_limit', isBuildTime ? '2' : '10')
databaseUrl.searchParams.set('pool_timeout', isBuildTime ? '30' : '60')
databaseUrl.searchParams.set('connect_timeout', '10')
databaseUrl.searchParams.set('socket_timeout', '45')

// 3. 🔧 CRITICAL FIX: Proper Prisma singleton pattern
// This prevents creating multiple PrismaClient instances in development
// which causes connection pool exhaustion due to Next.js hot module reloading
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Query counter for monitoring excessive database queries
let queryCount = 0
let resetTimer: NodeJS.Timeout | null = null

// 🔧 FIX: Only create new PrismaClient if one doesn't already exist
// Previously: Created new instance every time, causing connection leaks
// Now: Reuse existing instance in development, preventing connection pool exhaustion
function createPrismaClient() {
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
  return basePrisma.$extends({
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
}

// 🔧 FIX: Reuse existing instance in development, create new in production
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 4. Keep singleton in development (prevents connection pool exhaustion)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 5. Graceful shutdown in production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
