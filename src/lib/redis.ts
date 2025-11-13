/**
 * Redis 连接管理
 *
 * 功能：
 * - 单例模式连接 Redis
 * - 自动重连机制
 * - 优雅降级（Redis 故障时不影响应用）
 * - 连接池管理
 */

import { Redis, RedisOptions } from 'ioredis';

let redis: Redis | null = null;
let isRedisAvailable = false;
let connectionAttempted = false;

// Redis 配置
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),

  // 重连策略
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis 重连尝试 ${times}，延迟 ${delay}ms`);
    return delay;
  },

  // 连接超时
  connectTimeout: 10000,

  // 最大重试次数
  maxRetriesPerRequest: 3,

  // 启用离线队列（连接断开时缓存命令）
  enableOfflineQueue: false,

  // 连接名称（便于调试）
  connectionName: 'butternovel',
};

/**
 * 获取 Redis 客户端实例
 * 单例模式，确保整个应用只有一个连接
 */
export function getRedisClient(): Redis | null {
  // 如果已经尝试连接且失败，直接返回 null
  if (connectionAttempted && !isRedisAvailable) {
    return null;
  }

  // 如果已经有可用的连接，直接返回
  if (redis && isRedisAvailable) {
    return redis;
  }

  // 尝试建立连接
  try {
    connectionAttempted = true;

    redis = new Redis(redisConfig);

    // 连接成功事件
    redis.on('connect', () => {
      console.log('✓ Redis 连接成功');
      isRedisAvailable = true;
    });

    // 连接就绪事件
    redis.on('ready', () => {
      console.log('✓ Redis 已就绪');
      isRedisAvailable = true;
    });

    // 错误事件
    redis.on('error', (error: Error) => {
      console.error('✗ Redis 连接错误:', error.message);
      isRedisAvailable = false;
    });

    // 断开连接事件
    redis.on('close', () => {
      console.log('⚠ Redis 连接已关闭');
      isRedisAvailable = false;
    });

    // 重连事件
    redis.on('reconnecting', () => {
      console.log('↻ Redis 正在重连...');
    });

    return redis;
  } catch (error) {
    console.error('✗ Redis 初始化失败:', error);
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
 * 安全的 Redis 操作封装
 * 如果 Redis 不可用，自动降级为不操作（返回 null）
 */
export async function safeRedisGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return null;
  }

  try {
    return await client.get(key);
  } catch (error) {
    console.error(`Redis GET 失败 (${key}):`, error);
    return null;
  }
}

export async function safeRedisSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return false;
  }

  try {
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    console.error(`Redis SET 失败 (${key}):`, error);
    return false;
  }
}

export async function safeRedisDel(key: string | string[]): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Redis DEL 失败:`, error);
    return false;
  }
}

export async function safeRedisDelPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return 0;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`Redis 删除模式匹配键失败 (${pattern}):`, error);
    return 0;
  }
}

/**
 * 关闭 Redis 连接
 * 用于应用关闭时清理资源
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      console.log('✓ Redis 连接已安全关闭');
    } catch (error) {
      console.error('✗ Redis 关闭失败:', error);
    } finally {
      redis = null;
      isRedisAvailable = false;
    }
  }
}

// 导出 Redis 客户端（可选，供高级用法）
export { redis };
