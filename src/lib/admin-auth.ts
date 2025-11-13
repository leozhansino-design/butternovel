import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')

  if (!token) {
    return null
  }

  try {
    // ✅ 移除默认值 - 如果环境变量未设置，立即失败
    const jwtSecret = process.env.ADMIN_JWT_SECRET
    if (!jwtSecret) {
      console.error('ADMIN_JWT_SECRET environment variable is not configured')
      return null
    }

    const secret = new TextEncoder().encode(jwtSecret)
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