/**
 * 缓存功能模块
 *
 * 功能：
 * - 封装 Redis 缓存操作
 * - 自动降级到数据库（Redis 不可用时）
 * - 统一缓存键命名规范
 * - 提供针对不同数据类型的缓存方法
 */

import { safeRedisGet, safeRedisSet, safeRedisDel, safeRedisDelPattern, isRedisConnected } from './redis';

// ========================
// 缓存键命名规范
// ========================

export const CacheKeys = {
  // 首页相关
  HOME_FEATURED: 'home:featured', // 首页 Featured 小说
  HOME_CATEGORY: (categorySlug: string) => `home:category:${categorySlug}`, // 首页分类小说
  HOME_ALL_CATEGORIES: 'home:all-categories', // 所有分类列表

  // 小说详情
  NOVEL: (slug: string) => `novel:${slug}`, // 小说详情
  NOVEL_STATS: (novelId: string) => `novel:${novelId}:stats`, // 小说统计（点赞、章节数）

  // 分类相关
  CATEGORY: (slug: string) => `category:${slug}`, // 分类信息
  CATEGORY_NOVELS: (slug: string) => `category:${slug}:novels`, // 分类下的小说
  CATEGORY_PAGE: (slug: string) => `category:${slug}:page`, // 分类页面完整数据（包含分类信息+小说列表）

  // 用户书架（需要包含用户 ID）
  USER_LIBRARY: (userId: string) => `user:${userId}:library`, // 用户书架
  USER_LIBRARY_CHECK: (userId: string, novelSlug: string) => `user:${userId}:library:check:${novelSlug}`, // 检查是否在书架

  // 模式匹配键（用于批量删除）
  PATTERN_HOME: 'home:*', // 所有首页相关缓存
  PATTERN_NOVEL: (slug: string) => `novel:${slug}*`, // 某个小说的所有缓存
  PATTERN_CATEGORY: (slug: string) => `category:${slug}*`, // 某个分类的所有缓存
  PATTERN_USER_LIBRARY: (userId: string) => `user:${userId}:library*`, // 用户书架所有缓存
} as const;

// ========================
// 缓存 TTL（生存时间，秒）
// ========================

export const CacheTTL = {
  HOME_FEATURED: 60 * 60, // 1 小时
  HOME_CATEGORY: 60 * 30, // 30 分钟
  CATEGORY_NOVELS: 60 * 30, // 30 分钟
  CATEGORY_PAGE: 60 * 30, // 30 分钟
  NOVEL_DETAIL: 60 * 10, // 10 分钟
  NOVEL_STATS: 60 * 5, // 5 分钟
  USER_LIBRARY: 0, // 实时（不过期，手动清除）
  USER_LIBRARY_CHECK: 60 * 5, // 5 分钟
} as const;

// ========================
// 缓存操作封装
// ========================

/**
 * 安全的 JSON 序列化（处理 BigInt）
 * Prisma 返回的数据可能包含 BigInt 类型（如 _count 字段）
 */
function safeStringify(data: any): string {
  return JSON.stringify(data, (key, value) => {
    // 将 BigInt 转换为 Number
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return value;
  });
}

/**
 * 通用缓存获取方法
 * 如果缓存命中，返回缓存数据；否则执行 fetchFunction 并缓存结果
 *
 * @param key 缓存键
 * @param fetchFunction 数据获取函数（从数据库）
 * @param ttl 缓存过期时间（秒）
 * @returns 数据
 */
export async function getOrSet<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl?: number
): Promise<T> {
  try {
    // 1. 尝试从缓存获取
    const cached = await safeRedisGet(key);

    if (cached) {
      // 缓存命中
      try {
        const data = JSON.parse(cached);
        console.log(`✓ 缓存命中: ${key}`);
        return data as T;
      } catch (parseError) {
        console.error(`✗ 缓存数据解析失败 (${key}):`, parseError);
        // 解析失败，删除损坏的缓存
        await safeRedisDel(key);
      }
    }

    // 2. 缓存未命中或 Redis 不可用，从数据库获取
    console.log(`✗ 缓存未命中，查询数据库: ${key}`);
    const data = await fetchFunction();

    // 3. 将数据写入缓存（如果 Redis 可用）
    if (isRedisConnected()) {
      try {
        const serialized = safeStringify(data); // 🔧 使用 BigInt 安全序列化
        await safeRedisSet(key, serialized, ttl);
        console.log(`✓ 数据已缓存: ${key} (TTL: ${ttl || '无限'}s)`);
      } catch (serializeError) {
        console.error(`✗ 数据序列化失败 (${key}):`, serializeError);
      }
    }

    return data;
  } catch (error) {
    // 如果任何步骤失败，回退到直接查询数据库
    console.error(`✗ 缓存操作失败，回退到数据库查询 (${key}):`, error);
    return fetchFunction();
  }
}

/**
 * 删除单个缓存键
 */
export async function invalidate(key: string): Promise<void> {
  try {
    const deleted = await safeRedisDel(key);
    if (deleted) {
      console.log(`✓ 缓存已清除: ${key}`);
    }
  } catch (error) {
    console.error(`✗ 缓存清除失败 (${key}):`, error);
  }
}

/**
 * 删除多个缓存键
 */
export async function invalidateMultiple(keys: string[]): Promise<void> {
  try {
    const deleted = await safeRedisDel(keys);
    if (deleted) {
      console.log(`✓ 缓存已清除: ${keys.join(', ')}`);
    }
  } catch (error) {
    console.error(`✗ 批量缓存清除失败:`, error);
  }
}

/**
 * 删除匹配模式的所有缓存键
 * 例如：invalidatePattern('novel:my-novel*') 会删除该小说的所有相关缓存
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const count = await safeRedisDelPattern(pattern);
    if (count > 0) {
      console.log(`✓ 缓存已清除 (模式: ${pattern}, 数量: ${count})`);
    }
  } catch (error) {
    console.error(`✗ 模式缓存清除失败 (${pattern}):`, error);
  }
}

// ========================
// 特定业务缓存方法
// ========================

/**
 * 清除首页所有缓存
 * 场景：创建新小说、更新小说分类
 */
export async function invalidateHomeCache(): Promise<void> {
  console.log('清除首页缓存...');
  await invalidatePattern(CacheKeys.PATTERN_HOME);
}

/**
 * 清除某个小说的所有缓存
 * 场景：更新小说信息、发布新章节、删除章节
 */
export async function invalidateNovelCache(slug: string): Promise<void> {
  console.log(`清除小说缓存: ${slug}`);
  await invalidatePattern(CacheKeys.PATTERN_NOVEL(slug));
}

/**
 * 清除某个分类的所有缓存
 * 场景：该分类下有小说变动
 */
export async function invalidateCategoryCache(categorySlug: string): Promise<void> {
  console.log(`清除分类缓存: ${categorySlug}`);
  await Promise.all([
    invalidate(CacheKeys.HOME_CATEGORY(categorySlug)),
    invalidatePattern(CacheKeys.PATTERN_CATEGORY(categorySlug)),
  ]);
}

/**
 * 清除用户书架缓存
 * 场景：用户添加/删除书架项
 */
export async function invalidateUserLibraryCache(userId: string): Promise<void> {
  console.log(`清除用户书架缓存: ${userId}`);
  await invalidatePattern(CacheKeys.PATTERN_USER_LIBRARY(userId));
}

/**
 * 清除小说相关的所有缓存（包括首页和分类）
 * 场景：创建/更新/删除小说时的完整缓存清除
 *
 * @param novelSlug 小说 slug
 * @param categorySlug 小说所属分类 slug（可选）
 */
export async function invalidateNovelRelatedCache(
  novelSlug: string,
  categorySlug?: string
): Promise<void> {
  console.log(`清除小说相关的所有缓存: ${novelSlug}`);

  const tasks = [
    invalidateHomeCache(), // 清除首页
    invalidateNovelCache(novelSlug), // 清除小说详情
  ];

  // 如果提供了分类，也清除分类缓存
  if (categorySlug) {
    tasks.push(invalidateCategoryCache(categorySlug));
  }

  await Promise.all(tasks);
}

// ========================
// 缓存状态检查
// ========================

/**
 * 检查 Redis 连接状态
 */
export function isCacheAvailable(): boolean {
  return isRedisConnected();
}

/**
 * 获取缓存统计信息（调试用）
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  message: string;
}> {
  const available = isRedisConnected();

  return {
    available,
    message: available
      ? 'Redis 缓存正常运行'
      : 'Redis 缓存不可用，已降级到数据库查询',
  };
}
