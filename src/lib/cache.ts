// src/lib/cache.ts
import { redis } from './redis'

// ============================================
// Cache TTL Configuration (in seconds)
// ============================================
const TTL = {
  HOME: 3600,          // 1 hour - Home page novels
  CATEGORY: 1800,      // 30 minutes - Category novels
  NOVEL: 600,          // 10 minutes - Novel details
  CATEGORIES_LIST: 86400, // 1 day - Categories list
} as const

// ============================================
// Cache Key Generators
// ============================================
const keys = {
  home: () => 'cache:home:novels',
  category: (categoryId: number) => `cache:category:${categoryId}:novels`,
  novel: (slug: string) => `cache:novel:${slug}`,
  categories: () => 'cache:categories:list',
  userLibrary: (userId: string) => `user:${userId}:library`,
} as const

// ============================================
// Generic Cache Functions
// ============================================

/**
 * Get data from cache
 */
export async function getCacheData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key)
    if (data) {
      console.log(`[Cache] HIT: ${key}`)
    } else {
      console.log(`[Cache] MISS: ${key}`)
    }
    return data
  } catch (error) {
    console.error(`[Cache] Error getting ${key}:`, error)
    return null
  }
}

/**
 * Set data in cache with TTL
 */
export async function setCacheData<T>(
  key: string,
  data: T,
  ttl: number
): Promise<boolean> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data))
    console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`)
    return true
  } catch (error) {
    console.error(`[Cache] Error setting ${key}:`, error)
    return false
  }
}

/**
 * Delete data from cache
 */
export async function deleteCacheData(key: string): Promise<boolean> {
  try {
    await redis.del(key)
    console.log(`[Cache] DEL: ${key}`)
    return true
  } catch (error) {
    console.error(`[Cache] Error deleting ${key}:`, error)
    return false
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteByPattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) {
      console.log(`[Cache] No keys found matching pattern: ${pattern}`)
      return 0
    }

    await redis.del(...keys)
    console.log(`[Cache] DEL ${keys.length} keys matching: ${pattern}`)
    return keys.length
  } catch (error) {
    console.error(`[Cache] Error deleting pattern ${pattern}:`, error)
    return 0
  }
}

// ============================================
// Home Page Cache
// ============================================

export async function getHomeNovels<T>(): Promise<T | null> {
  return getCacheData<T>(keys.home())
}

export async function setHomeNovels<T>(data: T): Promise<boolean> {
  return setCacheData(keys.home(), data, TTL.HOME)
}

export async function invalidateHomeCache(): Promise<boolean> {
  return deleteCacheData(keys.home())
}

// ============================================
// Category Page Cache
// ============================================

export async function getCategoryNovels<T>(categoryId: number): Promise<T | null> {
  return getCacheData<T>(keys.category(categoryId))
}

export async function setCategoryNovels<T>(
  categoryId: number,
  data: T
): Promise<boolean> {
  return setCacheData(keys.category(categoryId), data, TTL.CATEGORY)
}

export async function invalidateCategoryCache(categoryId: number): Promise<boolean> {
  return deleteCacheData(keys.category(categoryId))
}

export async function invalidateAllCategoryCache(): Promise<number> {
  return deleteByPattern('cache:category:*')
}

// ============================================
// Novel Detail Cache
// ============================================

export async function getNovelCache<T>(slug: string): Promise<T | null> {
  return getCacheData<T>(keys.novel(slug))
}

export async function setNovelCache<T>(slug: string, data: T): Promise<boolean> {
  return setCacheData(keys.novel(slug), data, TTL.NOVEL)
}

export async function invalidateNovelCache(slug: string): Promise<boolean> {
  return deleteCacheData(keys.novel(slug))
}

// ============================================
// Categories List Cache
// ============================================

export async function getCategoriesCache<T>(): Promise<T | null> {
  return getCacheData<T>(keys.categories())
}

export async function setCategoriesCache<T>(data: T): Promise<boolean> {
  return setCacheData(keys.categories(), data, TTL.CATEGORIES_LIST)
}

export async function invalidateCategoriesCache(): Promise<boolean> {
  return deleteCacheData(keys.categories())
}

// ============================================
// User Library (Redis Sets)
// ============================================

/**
 * Add novel to user's library set
 */
export async function addToUserLibrary(
  userId: string,
  novelId: number
): Promise<boolean> {
  try {
    await redis.sadd(keys.userLibrary(userId), novelId)
    console.log(`[Cache] Added novel ${novelId} to user ${userId} library`)
    return true
  } catch (error) {
    console.error('[Cache] Error adding to user library:', error)
    return false
  }
}

/**
 * Remove novel from user's library set
 */
export async function removeFromUserLibrary(
  userId: string,
  novelId: number
): Promise<boolean> {
  try {
    await redis.srem(keys.userLibrary(userId), novelId)
    console.log(`[Cache] Removed novel ${novelId} from user ${userId} library`)
    return true
  } catch (error) {
    console.error('[Cache] Error removing from user library:', error)
    return false
  }
}

/**
 * Check if novel is in user's library
 */
export async function isInUserLibrary(
  userId: string,
  novelId: number
): Promise<boolean> {
  try {
    const result = await redis.sismember(keys.userLibrary(userId), novelId)
    return result === 1
  } catch (error) {
    console.error('[Cache] Error checking user library:', error)
    return false
  }
}

/**
 * Get all novels in user's library
 */
export async function getUserLibraryNovels(userId: string): Promise<number[]> {
  try {
    const novels = await redis.smembers(keys.userLibrary(userId))
    return novels.map(id => Number(id))
  } catch (error) {
    console.error('[Cache] Error getting user library:', error)
    return []
  }
}

// ============================================
// Smart Cache Invalidation
// ============================================

/**
 * Invalidate all caches related to a novel
 * Call this when novel is created/updated/deleted
 */
export async function invalidateNovelRelatedCaches(
  slug: string,
  categoryId?: number
): Promise<void> {
  console.log(`[Cache] Invalidating all caches for novel: ${slug}`)

  // Invalidate novel detail
  await invalidateNovelCache(slug)

  // Invalidate home page
  await invalidateHomeCache()

  // Invalidate category cache if categoryId provided
  if (categoryId) {
    await invalidateCategoryCache(categoryId)
  } else {
    // If no categoryId, invalidate all category caches to be safe
    await invalidateAllCategoryCache()
  }
}

/**
 * Invalidate caches when a chapter is added/updated/deleted
 * This affects novel detail page (chapter count, etc.)
 */
export async function invalidateChapterRelatedCaches(
  novelSlug: string,
  categoryId?: number
): Promise<void> {
  console.log(`[Cache] Invalidating caches for chapter update in: ${novelSlug}`)

  // Invalidate novel detail (chapter count changes)
  await invalidateNovelCache(novelSlug)

  // Home and category caches might show chapter count
  await invalidateHomeCache()

  if (categoryId) {
    await invalidateCategoryCache(categoryId)
  }
}

/**
 * Invalidate all caches (nuclear option)
 * Use sparingly - only for major changes
 */
export async function invalidateAllCaches(): Promise<void> {
  console.log('[Cache] NUCLEAR: Invalidating ALL caches')
  await deleteByPattern('cache:*')
}
