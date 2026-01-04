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
  console.log('[Mobile Auth] Starting authentication...')

  // First, try NextAuth session (for web users)
  const session = await auth()
  console.log('[Mobile Auth] Session check:', session?.user?.id ? 'found' : 'not found')

  if (session?.user?.id) {
    console.log('[Mobile Auth] Using session auth for user:', session.user.id)
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
  console.log('[Mobile Auth] Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'none')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    console.log('[Mobile Auth] Token length:', token.length)
    console.log('[Mobile Auth] Token preview:', token.substring(0, 50) + '...')

    try {
      console.log('[Mobile Auth] Verifying JWT...')
      const { payload } = await jwtVerify(token, secret)
      console.log('[Mobile Auth] JWT verified, payload:', JSON.stringify(payload))

      // Verify user exists in database
      const userId = payload.id as string
      if (!userId) {
        console.log('[Mobile Auth] No user ID in token payload')
        return { user: null, error: 'Invalid token: no user ID' }
      }

      // Optional: verify user still exists in database
      console.log('[Mobile Auth] Looking up user:', userId)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      })

      if (!user) {
        console.log('[Mobile Auth] User not found in database')
        return { user: null, error: 'User not found' }
      }

      console.log('[Mobile Auth] Authentication successful for:', user.email)
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

  console.log('[Mobile Auth] No authentication provided')
  return { user: null, error: 'No authentication provided' }
}
