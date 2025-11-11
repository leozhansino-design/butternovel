// src/lib/db-utils.ts
// 数据库查询工具 - 带重试和错误处理

import { Prisma } from '@prisma/client'

/**
 * 重试配置
 */
interface RetryConfig {
  maxRetries: number
  baseDelay: number // ms
  maxDelay: number // ms
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 2000,
}

/**
 * 计算指数退避延迟
 */
function getBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  // 添加随机抖动（±20%）避免惊群效应
  const jitter = delay * 0.2 * (Math.random() * 2 - 1)
  return delay + jitter
}

/**
 * 判断错误是否可以重试
 */
function isRetryableError(error: any): boolean {
  // Prisma 连接错误
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true
  }

  // Prisma 连接超时
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Database server timeout
    // P1008: Operations timed out
    return ['P1001', 'P1002', 'P1008'].includes(error.code)
  }

  // 通用连接错误
  if (error?.message) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('etimedout')
    )
  }

  return false
}

/**
 * 带重试的数据库查询
 *
 * @example
 * const users = await withRetry(
 *   () => prisma.user.findMany({ where: { active: true } })
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_RETRY_CONFIG, ...config }

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // 不是可重试错误，直接抛出
      if (!isRetryableError(error)) {
        throw error
      }

      // 已达最大重试次数
      if (attempt === maxRetries) {
        console.error(`❌ Database query failed after ${maxRetries} retries`, {
          error: error instanceof Error ? error.message : String(error),
          errorCode: error?.code,
        })
        throw error
      }

      // 计算延迟并重试
      const delay = getBackoffDelay(attempt, baseDelay, maxDelay)

      console.warn(`⚠️  Database query failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`, {
        error: error instanceof Error ? error.message : String(error),
        errorCode: error?.code,
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * 安全的数据库查询 - 失败时返回默认值
 *
 * @example
 * const users = await withFallback(
 *   () => prisma.user.findMany(),
 *   []
 * )
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallbackValue: T,
  config?: Partial<RetryConfig>
): Promise<T> {
  try {
    return await withRetry(fn, config)
  } catch (error) {
    console.error('❌ Database query failed, using fallback value', {
      error: error instanceof Error ? error.message : String(error),
      errorCode: error?.code,
      fallbackValue: typeof fallbackValue === 'object'
        ? Array.isArray(fallbackValue)
          ? `Array(${fallbackValue.length})`
          : 'Object'
        : fallbackValue,
    })
    return fallbackValue
  }
}

/**
 * 批量查询 - 带并发控制
 * 避免同时发起太多查询导致连接池耗尽
 *
 * @example
 * const results = await withConcurrency(
 *   ids.map(id => () => prisma.user.findUnique({ where: { id } })),
 *   { concurrency: 3 }
 * )
 */
export async function withConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  options: { concurrency?: number } = {}
): Promise<T[]> {
  const concurrency = options.concurrency || 3
  const results: T[] = []

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(task => withRetry(task)))
    results.push(...batchResults)
  }

  return results
}
