import { NextResponse } from 'next/server'

export async function POST() {
  console.log('[Logout] Admin logging out...')

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  })

  // 删除 Cookie - set to empty and expire immediately
  response.cookies.set('admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  console.log('[Logout] Cookie cleared')

  return response
}