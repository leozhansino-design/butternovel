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

// 🔧 FIX: Ultra-aggressive connection pool settings for serverless
// - connection_limit: 1 (minimum possible)
// - pool_timeout: 5 seconds (very short - release connections quickly)
// - connect_timeout: 5 seconds (fail fast)
// - socket_timeout: 30 seconds (shorter timeout)
// Rationale: In serverless, Lambda instances come and go rapidly.
// We need connections to be released ASAP to avoid pool exhaustion.
databaseUrl.searchParams.set('connection_limit', '1')
databaseUrl.searchParams.set('pool_timeout', '5')  // Reduced from 20 to 5
databaseUrl.searchParams.set('connect_timeout', '5')  // Reduced from 10 to 5
databaseUrl.searchParams.set('socket_timeout', '30')  // Reduced from 60 to 30
databaseUrl.searchParams.set('pgbouncer', 'true')
databaseUrl.searchParams.set('statement_cache_size', '0')  // Disable statement caching

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

          // 🔧 FIX: Auto-retry on connection pool exhaustion
          let retries = 2
          while (retries > 0) {
            try {
              return await query(args)
            } catch (error: any) {
              // Check if it's a connection pool error
              if (error?.message?.includes('Max client connections reached') && retries > 0) {
                console.warn(`[Database] Connection pool exhausted. Retrying... (${retries} left)`)
                retries--

                // Wait a bit before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)))

                // Try to disconnect and reconnect
                try {
                  await basePrisma.$disconnect()
                } catch {
                  // Ignore disconnect errors
                }

                continue
              }
              throw error
            }
          }

          // Should never reach here, but TypeScript needs it
          throw new Error('Unexpected: Query retry loop exited without result')
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

// 5. Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })

  // In serverless, also disconnect on SIGTERM
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
  })
}
