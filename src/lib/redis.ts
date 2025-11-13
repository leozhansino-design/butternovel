// src/lib/redis.ts
import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined')
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined')
}

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Test connection function
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    console.log('[Redis] Connection successful')
    return true
  } catch (error) {
    console.error('[Redis] Connection failed:', error)
    return false
  }
}

// Helper function to handle Redis errors gracefully
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error('[Redis] Operation failed:', error)
    return fallback
  }
}
