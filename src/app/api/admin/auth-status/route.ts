import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

/**
 * Debug endpoint to check admin authentication status
 * GET /api/admin/auth-status
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        reason: 'No admin-token cookie found',
        action: 'Please login at /admin/login'
      })
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.ADMIN_JWT_SECRET || 'butternovel-dev-secret-min-32-characters-long-DO-NOT-USE-IN-PRODUCTION'
      )

      const { payload } = await jwtVerify(token.value, secret)

      const hasRequiredFields = !!(payload.id && payload.email && payload.name && payload.role)

      return NextResponse.json({
        authenticated: hasRequiredFields,
        tokenValid: true,
        hasId: !!payload.id,
        hasEmail: !!payload.email,
        hasName: !!payload.name,
        hasRole: !!payload.role,
        email: payload.email,
        role: payload.role,
        issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
        ...(hasRequiredFields
          ? { status: 'Valid session' }
          : {
              status: 'Invalid session - missing required fields',
              reason: 'Token was created with old code. Please logout and login again.',
              action: 'Visit /api/admin/logout then login again at /admin/login'
            }
        )
      })
    } catch (verifyError: any) {
      return NextResponse.json({
        authenticated: false,
        tokenValid: false,
        reason: `JWT verification failed: ${verifyError.message}`,
        possibleCauses: [
          'Token was signed with a different secret',
          'Token has expired',
          'Token is malformed'
        ],
        action: 'Please logout and login again'
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 })
  }
}
