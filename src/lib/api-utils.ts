// src/lib/api-utils.ts
// 🔧 Utility functions for API routes with proper error handling

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * Handle Prisma errors with user-friendly messages
 *
 * Usage:
 * ```typescript
 * try {
 *   const user = await prisma.user.create({ ... })
 *   return NextResponse.json({ user })
 * } catch (error) {
 *   return handlePrismaError(error, 'Failed to create user')
 * }
 * ```
 */
export function handlePrismaError(error: unknown, defaultMessage = 'Database operation failed'): NextResponse {
  console.error('[API] Prisma error:', error)

  // Type guard for Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || []
        return NextResponse.json(
          { error: `This ${target.join(', ')} already exists` },
          { status: 409 }
        )

      case 'P2025':
        // Record not found
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        )

      case 'P2003':
        // Foreign key constraint violation
        return NextResponse.json(
          { error: 'Related resource not found' },
          { status: 400 }
        )

      default:
        return NextResponse.json(
          { error: defaultMessage, code: error.code },
          { status: 400 }
        )
    }
  }

  // Handle connection errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('[API] Database connection error:', error.message)

    return NextResponse.json(
      {
        error: 'Database connection error. Please try again.',
        message: 'Our servers are experiencing high load. Please retry in a moment.',
      },
      { status: 503 }
    )
  }

  // Handle validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: 'Invalid data provided' },
      { status: 400 }
    )
  }

  // Generic error
  if (error instanceof Error) {
    // Don't expose internal error messages to users
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        error: defaultMessage,
        ...(isDevelopment && { debug: error.message }),
      },
      { status: 500 }
    )
  }

  // Unknown error type
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  )
}

/**
 * Retry a database operation with exponential backoff
 *
 * Usage:
 * ```typescript
 * const user = await retryOperation(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   'fetch user'
 * )
 * ```
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error

      // Only retry on connection errors
      const isRetryable =
        error instanceof Prisma.PrismaClientInitializationError ||
        error?.code === 'P1001' || // Can't reach database
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P1017' || // Server closed connection
        error?.message?.includes('Max client connections reached')

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 100ms, 200ms, 400ms, 800ms
      const delay = Math.min(100 * Math.pow(2, attempt), 2000)
      console.warn(
        `[Retry] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`
      )
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Validate request body with type safety
 *
 * Usage:
 * ```typescript
 * const body = await validateRequestBody<{ email: string }>(req, ['email'])
 * if (!body) {
 *   return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
 * }
 * ```
 */
export async function validateRequestBody<T extends Record<string, any>>(
  req: Request,
  requiredFields: (keyof T)[]
): Promise<T | null> {
  try {
    const body = await req.json()

    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in body) || body[field] === undefined || body[field] === null) {
        console.warn(`[Validation] Missing required field: ${String(field)}`)
        return null
      }
    }

    return body as T
  } catch (error) {
    console.error('[Validation] Failed to parse request body:', error)
    return null
  }
}

/**
 * Create a success response with consistent format
 */
export function successResponse<T>(data: T, message?: string, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Create an error response with consistent format
 */
export function errorResponse(
  error: string,
  status = 400,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...details,
    },
    { status }
  )
}
