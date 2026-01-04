// src/lib/mobile-auth.ts
// Utility for authenticating mobile app requests with JWT tokens

import { jwtVerify } from 'jose'
import { auth } from './auth'
import { prisma } from './prisma'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

interface MobileUser {
  id: string
  email: string
  name: string | null
}

interface AuthResult {
  user: MobileUser | null
  error?: string
}

/**
 * Authenticate a request - supports both NextAuth session and mobile JWT tokens
 * @param request - The incoming request
 * @returns The authenticated user or null
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  // First, try NextAuth session (for web users)
  const session = await auth()
  if (session?.user?.id) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || null,
      }
    }
  }

  // If no session, try Bearer token (for mobile users)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    try {
      const { payload } = await jwtVerify(token, secret)

      // Verify user exists in database
      const userId = payload.id as string
      if (!userId) {
        return { user: null, error: 'Invalid token: no user ID' }
      }

      // Optional: verify user still exists in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      })

      if (!user) {
        return { user: null, error: 'User not found' }
      }

      return {
        user: {
          id: user.id,
          email: user.email || '',
          name: user.name,
        }
      }
    } catch (error) {
      console.error('[Mobile Auth] JWT verification failed:', error)
      return { user: null, error: 'Invalid or expired token' }
    }
  }

  return { user: null, error: 'No authentication provided' }
}
