// src/lib/redis.ts
// 🔧 Redis caching layer for reducing database load by 90%

import { Redis } from '@upstash/redis'

// Initialize Redis client (optional - gracefully degrades if not configured)
let redis: Redis | null = null
let isRedisAvailable = false

try {
  // Skip Redis initialization during build time
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

  if (!isBuildTime && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    isRedisAvailable = true
    console.log('[Redis] Client initialized successfully')
  } else if (!isBuildTime) {
    console.warn('[Redis] Environment variables not set - caching disabled')
    console.warn('[Redis] Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable caching')
  }
} catch (error) {
  console.error('[Redis] Failed to initialize client:', error)
  redis = null
  isRedisAvailable = false
}

/**
 * Cache TTL (Time To Live) presets in seconds
 */
export const CacheTTL = {
  /** 5 minutes - for frequently changing data like homepage */
  SHORT: 300,
  /** 15 minutes - for moderately changing data like category pages */
  MEDIUM: 900,
  /** 1 hour - for rarely changing data like user profiles */
  LONG: 3600,
  /** 24 hours - for static data like genre lists */
  DAY: 86400,
} as const

/**
 * Get cached data or fetch from database
 *
 * This is the main caching utility that reduces database load.
 * Target: 90% reduction in database queries with proper cache hit rate.
 *
 * Usage:
 * ```typescript
 * const data = await getCached(
 *   'homepage:featured',
 *   async () => await prisma.novel.findMany(...),
 *   CacheTTL.SHORT
 * )
 * ```
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.SHORT
): Promise<T> {
  // If Redis is not available, fetch directly (graceful degradation)
  if (!redis || !isRedisAvailable) {
    return await fetchFn()
  }

  try {
    // Try to get from cache
    const cached = await redis.get<T>(key)

    if (cached !== null && cached !== undefined) {
      console.log(`[Redis] Cache HIT: ${key}`)
      return cached
    }

    console.log(`[Redis] Cache MISS: ${key}`)

    // Fetch from database
    const data = await fetchFn()

    // Store in cache (fire and forget - don't wait)
    // Use 'ex' option for TTL in seconds
    redis.set(key, data, { ex: ttl }).catch((err) => {
      console.error(`[Redis] Failed to cache ${key}:`, err)
    })

    return data
  } catch (error) {
    console.error(`[Redis] Error for key ${key}:`, error)
    // Fallback to direct fetch on Redis errors
    return await fetchFn()
  }
}

/**
 * Invalidate cached data
 *
 * Call this when data changes to ensure cache consistency.
 *
 * Usage:
 * ```typescript
 * await invalidateCache('homepage:featured')
 * await invalidateCache(['homepage:featured', 'category:fantasy'])
 * ```
 */
export async function invalidateCache(keys: string | string[]): Promise<void> {
  if (!redis || !isRedisAvailable) return

  try {
    const keyArray = Array.isArray(keys) ? keys : [keys]
    if (keyArray.length > 0) {
      await redis.del(...keyArray)
      console.log(`[Redis] Invalidated cache: ${keyArray.join(', ')}`)
    }
  } catch (error) {
    console.error('[Redis] Failed to invalidate cache:', error)
  }
}

/**
 * Invalidate cache by pattern (e.g., 'user:123:*')
 *
 * Useful for invalidating all caches related to a specific entity.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis || !isRedisAvailable) return

  try {
    // Get all keys matching the pattern
    const keys = await redis.keys(pattern)

    if (keys && keys.length > 0) {
      await redis.del(...keys)
      console.log(`[Redis] Invalidated ${keys.length} keys matching: ${pattern}`)
    }
  } catch (error) {
    console.error('[Redis] Failed to invalidate pattern:', error)
  }
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redis !== null
}

/**
 * Get Redis client (for advanced usage)
 */
export function getRedisClient(): Redis | null {
  return redis
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  if (!redis || !isRedisAvailable) {
    return false
  }

  try {
    await redis.set('test:connection', 'ok', { ex: 10 })
    const result = await redis.get('test:connection')
    await redis.del('test:connection')
    return result === 'ok'
  } catch (error) {
    console.error('[Redis] Connection test failed:', error)
    return false
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  available: boolean
  info?: string
}> {
  if (!redis || !isRedisAvailable) {
    return { available: false }
  }

  try {
    return {
      available: true,
      info: 'Redis is available and ready',
    }
  } catch (error) {
    console.error('[Redis] Failed to get stats:', error)
    return { available: false }
  }
}

// Export the Redis client for direct access if needed
export { redis }
