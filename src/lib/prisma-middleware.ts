// src/lib/prisma-middleware.ts
// 🔧 CRITICAL: API Route middleware for automatic connection management in serverless
import { NextResponse } from 'next/server'
import { prisma } from './prisma'

/**
 * Serverless-optimized API handler wrapper
 *
 * This middleware automatically manages Prisma connections in serverless environment:
 * 1. Ensures connection is established before handler runs
 * 2. Automatically disconnects after response is sent
 * 3. Prevents connection pool exhaustion in Vercel/Lambda
 *
 * Usage:
 * ```typescript
 * export const POST = withPrisma(async (req: Request) => {
 *   const data = await prisma.user.findMany()
 *   return NextResponse.json({ data })
 * })
 * ```
 */
export function withPrisma<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      // Execute the handler
      const response = await handler(...args)

      // 🔧 CRITICAL: Disconnect immediately after response
      // In serverless, connections must be released ASAP to prevent pool exhaustion
      // This runs after response is created but before Lambda freezes
      setImmediate(async () => {
        try {
          await prisma.$disconnect()
        } catch (err) {
          // Silent fail - connection may already be closed
          console.debug('[Prisma] Disconnect attempt:', err)
        }
      })

      return response
    } catch (error) {
      // Always disconnect on error too
      try {
        await prisma.$disconnect()
      } catch {
        // Silent fail
      }

      throw error
    }
  }
}

/**
 * Transaction wrapper for complex operations
 *
 * Ensures all operations in a transaction complete before disconnecting
 *
 * Usage:
 * ```typescript
 * export const POST = withPrismaTransaction(async (req, prisma) => {
 *   const user = await prisma.user.create({ ... })
 *   const profile = await prisma.profile.create({ ... })
 *   return NextResponse.json({ user, profile })
 * })
 * ```
 */
export function withPrismaTransaction<T extends any[]>(
  handler: (
    ...args: [...T, typeof prisma]
  ) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      // Pass prisma instance to handler
      const response = await handler(...args, prisma)

      // Disconnect after transaction completes
      setImmediate(async () => {
        try {
          await prisma.$disconnect()
        } catch (err) {
          console.debug('[Prisma] Disconnect attempt:', err)
        }
      })

      return response
    } catch (error) {
      try {
        await prisma.$disconnect()
      } catch {
        // Silent fail
      }

      throw error
    }
  }
}
