import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')

  console.log('[Auth Debug] Cookie check:', {
    hasCookie: !!token,
    tokenPreview: token ? `${token.value.substring(0, 20)}...` : 'none'
  })

  if (!token) {
    console.log('[Auth Debug] No admin-token cookie found')
    return null
  }

  try {
    // ✅ FIX: Use the same default secret as login route
    const secret = new TextEncoder().encode(
      process.env.ADMIN_JWT_SECRET || 'butternovel-dev-secret-min-32-characters-long-DO-NOT-USE-IN-PRODUCTION'
    )

    const { payload } = await jwtVerify(token.value, secret)

    console.log('[Auth Debug] JWT verified successfully:', {
      hasId: !!payload.id,
      email: payload.email,
      role: payload.role
    })

    // Check if token has the new id field
    if (!payload.id) {
      console.error('[Auth Debug] Token missing id field - user needs to re-login')
      return null
    }

    return {
      id: payload.id as string,        // ✅ FIX: Include id field
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    }
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error)
    return null
  }
}