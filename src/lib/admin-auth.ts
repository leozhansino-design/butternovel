import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')

  if (!token) {
    return null
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.ADMIN_JWT_SECRET || 'butternovel-super-secret-key-min-32-characters-long-change-in-production'
    )

    const { payload } = await jwtVerify(token.value, secret)

    return {
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    }
  } catch (error) {
    return null
  }
}