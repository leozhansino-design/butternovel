/**
 * Redis 连接管理 (Upstash REST API)
 *
 * 功能：
 * - 使用 Upstash Redis REST API（HTTP 连接，无需 TCP）
 * - 优雅降级（Redis 不可用时自动使用数据库）
 * - 无需端口或主机配置
 */

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
let isRedisAvailable = false;

/**
 * 获取 Redis 客户端实例
 * 使用 Upstash REST API（不需要 TCP 连接）
 */
export function getRedisClient(): Redis | null {
  // 如果已经初始化，直接返回
  if (redis) {
    return redis;
  }

  // 🔧 修复: 在构建时跳过 Redis 初始化，避免静态生成失败
  // Next.js 在构建时会尝试预渲染页面，此时不应该初始化 Redis
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildTime) {
    isRedisAvailable = false;
    return null;
  }

  // 检查环境变量
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    console.error('[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    isRedisAvailable = false;
    return null;
  }

  try {
    redis = new Redis({
      url: restUrl,
      token: restToken,
    });

    isRedisAvailable = true;
    return redis;
  } catch (error) {
    console.error('[Redis] Initialization failed:', error);
    isRedisAvailable = false;
    return null;
  }
}

/**
 * 检查 Redis 是否可用
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redis !== null;
}

/**
 * 安全的 Redis GET 操作
 * 如果 Redis 不可用，返回 null（自动降级）
 *
 * 🔧 修复：Upstash Redis 会自动反序列化 JSON，导致返回对象而不是字符串
 * 解决方案：如果返回的不是字符串，手动转回 JSON 字符串
 */
export async function safeRedisGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const value = await client.get(key);

    if (value === null || value === undefined) {
      return null;
    }

    // 如果 Upstash 返回的是对象而不是字符串，重新序列化
    if (typeof value === 'string') {
      return value;
    } else {
      return JSON.stringify(value);
    }
  } catch (error) {
    console.error(`[Redis GET] Failed (${key}):`, error);
    return null;
  }
}

/**
 * 安全的 Redis SET 操作
 * 如果 Redis 不可用，返回 false（自动降级）
 *
 * 🔧 修复：使用 Upstash Redis 正确的 API 格式
 * Upstash 使用 set(key, value, { ex: ttl }) 而不是 setex(key, ttl, value)
 */
export async function safeRedisSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    // 验证 value 是字符串
    if (typeof value !== 'string') {
      console.error(`[Redis SET] Value is not string! Type: ${typeof value}, Key: ${key}`);
      value = String(value);
    }

    if (ttlSeconds) {
      await client.set(key, value, { ex: ttlSeconds });
    } else {
      await client.set(key, value);
    }

    return true;
  } catch (error) {
    console.error(`[Redis SET] Failed (${key}):`, error);
    return false;
  }
}

/**
 * 安全的 Redis DEL 操作
 * 支持删除单个或多个键
 */
export async function safeRedisDel(key: string | string[]): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('[Redis DEL] Failed:', error);
    return false;
  }
}

/**
 * 删除匹配模式的所有键
 * 注意：Upstash 不直接支持 KEYS 命令，这里使用简化版本
 */
export async function safeRedisDelPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    // Upstash REST API 支持 keys 命令
    const keys = await client.keys(pattern);

    if (!keys || keys.length === 0) {
      return 0;
    }

    // 删除所有匹配的键
    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`[Redis DEL PATTERN] Failed (${pattern}):`, error);
    return 0;
  }
}

/**
 * 测试 Redis 连接
 */
export async function testRedisConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.set('test:connection', 'ok');
    const result = await client.get('test:connection');
    await client.del('test:connection');
    return result === 'ok';
  } catch (error) {
    console.error('Redis 连接测试失败:', error);
    return false;
  }
}

// 导出 Redis 客户端（可选，供高级用法）
export { redis };
