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
    console.log(`♻️ [Redis Init] Using existing Redis client (available: ${isRedisAvailable})`);
    return redis;
  }

  console.log(`🔧 [Redis Init] Initializing Redis client...`);

  // 🔧 修复: 在构建时跳过 Redis 初始化，避免静态生成失败
  // Next.js 在构建时会尝试预渲染页面，此时不应该初始化 Redis
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildTime) {
    console.log(`⏭️ [Redis Init] Skipping Redis initialization (build time)`);
    isRedisAvailable = false;
    return null;
  }

  // 检查环境变量
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  console.log(`🔍 [Redis Init] Environment check - URL: ${restUrl ? '✓ set' : '✗ missing'}, Token: ${restToken ? '✓ set' : '✗ missing'}`);

  if (!restUrl || !restToken) {
    console.error(`🚨 [Redis Init] Missing environment variables! URL: ${!!restUrl}, Token: ${!!restToken}`);
    isRedisAvailable = false;
    return null;
  }

  try {
    // ✅ 修复: 配置 Upstash Redis
    //
    // 问题：Upstash 默认使用 no-store fetch → 导致页面无法静态生成
    //
    // 解决方案：
    // 1. 在每个使用 Redis 的页面设置 fetchCache = 'force-cache'
    // 2. 使用 unstable_cache wrapper 包装 Redis 调用
    //
    // 注意：Upstash SDK 不支持直接覆盖 fetch 配置
    // 必须在应用层面处理缓存策略
    console.log(`🔌 [Redis Init] Creating Upstash Redis client...`);
    redis = new Redis({
      url: restUrl,
      token: restToken,
    });

    isRedisAvailable = true;
    console.log(`✅ [Redis Init] Redis client initialized successfully`);
    return redis;
  } catch (error) {
    console.error('🚨 [Redis Init] Redis initialization failed:', error);
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
    console.log(`🔴 [Redis GET] Client not available (key: ${key})`);
    return null;
  }

  try {
    console.log(`🔍 [Redis GET] Fetching key: ${key}`);
    const startTime = Date.now();

    // 不指定类型参数，让 Upstash 返回原始数据
    const value = await client.get(key);

    const duration = Date.now() - startTime;

    if (value === null || value === undefined) {
      console.log(`❌ [Redis GET] Cache MISS (key: ${key}, duration: ${duration}ms)`);
      return null;
    }

    console.log(`✅ [Redis GET] Cache HIT (key: ${key}, duration: ${duration}ms, size: ${JSON.stringify(value).length} bytes)`);

    // 如果 Upstash 返回的是对象而不是字符串，重新序列化
    if (typeof value === 'string') {
      console.log(`📝 [Redis GET] Value is already string (key: ${key})`);
      return value;
    } else {
      const serialized = JSON.stringify(value);
      console.log(`🔄 [Redis GET] Converted object to JSON string (key: ${key}, type: ${typeof value})`);
      return serialized;
    }
  } catch (error) {
    console.error(`🚨 [Redis GET] Failed (key: ${key}):`, error);
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
    console.log(`🔴 [Redis SET] Client not available (key: ${key})`);
    return false;
  }

  try {
    // 🔍 调试：验证 value 是字符串
    if (typeof value !== 'string') {
      console.error(`⚠️ [Redis SET] Value is not string! Type: ${typeof value}, Key: ${key}`);
      // 强制转换为字符串
      value = String(value);
    }

    const size = value.length;
    const ttlInfo = ttlSeconds ? `${ttlSeconds}s (${Math.round(ttlSeconds / 60)}min)` : 'none (永不过期)';
    console.log(`💾 [Redis SET] Writing key: ${key}, TTL: ${ttlInfo}, size: ${size} bytes`);

    const startTime = Date.now();

    if (ttlSeconds) {
      // Upstash Redis 正确用法：使用选项对象
      await client.set(key, value, { ex: ttlSeconds });
    } else {
      await client.set(key, value);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Redis SET] Success (key: ${key}, duration: ${duration}ms)`);
    return true;
  } catch (error) {
    console.error(`🚨 [Redis SET] Failed (key: ${key}):`, error);
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
    console.log(`🔴 [Redis DEL] Client not available`);
    return false;
  }

  try {
    const keys = Array.isArray(key) ? key : [key];
    console.log(`🗑️ [Redis DEL] Deleting ${keys.length} key(s): ${keys.join(', ')}`);

    if (keys.length > 0) {
      const startTime = Date.now();
      await client.del(...keys);
      const duration = Date.now() - startTime;
      console.log(`✅ [Redis DEL] Deleted ${keys.length} key(s) (duration: ${duration}ms)`);
    }
    return true;
  } catch (error) {
    console.error(`🚨 [Redis DEL] Failed:`, error);
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
    console.log(`🔴 [Redis DEL PATTERN] Client not available (pattern: ${pattern})`);
    return 0;
  }

  try {
    console.log(`🔍 [Redis DEL PATTERN] Searching for keys matching: ${pattern}`);
    const startTime = Date.now();

    // Upstash REST API 支持 keys 命令
    const keys = await client.keys(pattern);
    const searchDuration = Date.now() - startTime;

    if (!keys || keys.length === 0) {
      console.log(`❌ [Redis DEL PATTERN] No keys found matching pattern: ${pattern} (search duration: ${searchDuration}ms)`);
      return 0;
    }

    console.log(`📋 [Redis DEL PATTERN] Found ${keys.length} key(s) matching ${pattern}: ${keys.join(', ')}`);

    // 删除所有匹配的键
    const deleteStartTime = Date.now();
    await client.del(...keys);
    const deleteDuration = Date.now() - deleteStartTime;

    console.log(`✅ [Redis DEL PATTERN] Deleted ${keys.length} key(s) (search: ${searchDuration}ms, delete: ${deleteDuration}ms, total: ${searchDuration + deleteDuration}ms)`);
    return keys.length;
  } catch (error) {
    console.error(`🚨 [Redis DEL PATTERN] Failed (pattern: ${pattern}):`, error);
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
