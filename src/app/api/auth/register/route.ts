// src/app/api/auth/register/route.ts
// 🔧 OPTIMIZED: User registration with best practices for serverless
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handlePrismaError, retryOperation, successResponse, errorResponse } from '@/lib/api-utils'
import bcrypt from 'bcryptjs'
import { validateWithSchema, registerSchema } from '@/lib/validators'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ✅ Validate request with Zod
    const validation = validateWithSchema(registerSchema, body)
    if (!validation.success) {
      return errorResponse(validation.error, 400, { details: validation.details })
    }

    const { name, email, password } = validation.data

    // ⚠️ CRITICAL: Reserve "butterpicks" name for admin/official accounts only
    if (name) {
      const normalizedName = name.trim().toLowerCase()
      const isReservedName = normalizedName === 'butterpicks' || normalizedName.includes('butterpicks')

      if (isReservedName) {
        return errorResponse(
          'This name is reserved for official accounts. Please choose a different name.',
          400
        )
      }
    }

    // 🔧 BEST PRACTICE: Hash password BEFORE retry loop to avoid redundant work
    const hashedPassword = await bcrypt.hash(password, 10)

    // 🔧 BEST PRACTICE: Use retry wrapper for transient connection errors
    // This prevents registration failures due to temporary connection pool exhaustion
    const user = await retryOperation(
      async () => {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        })

        if (existingUser) {
          throw new Error('EMAIL_EXISTS')
        }

        // Create user
        return await prisma.user.create({
          data: {
            name: name ? name.trim() : 'User',
            email,
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      },
      'register user',
      3 // Retry up to 3 times on connection errors
    )

    console.log(`[Register] User created successfully: ${user.email}`)

    return successResponse(
      { user },
      'User created successfully',
      201
    )
  } catch (error: unknown) {
    console.error('[Register] Error creating user:', error)

    // Handle business logic errors
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return errorResponse('Email already registered', 409)
    }

    // Handle Prisma errors with proper status codes and user-friendly messages
    return handlePrismaError(error, 'Failed to create user')
  }
}
